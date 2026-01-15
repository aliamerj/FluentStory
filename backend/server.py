from fastapi import FastAPI, APIRouter, HTTPException, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, date, timedelta
from emergentintegrations.llm.chat import LlmChat, UserMessage
import asyncio
import re

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'fluentstory_db')]

# Emergent LLM Key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Create the main app
app = FastAPI(title="FluentStory API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============= MODELS =============

class UserCreate(BaseModel):
    email: str
    password: str
    native_language: Optional[str] = "English"
    target_language: Optional[str] = "Spanish"
    proficiency_level: Optional[str] = "Beginner"

class UserLogin(BaseModel):
    email: str
    password: str

class UserUpdate(BaseModel):
    native_language: Optional[str] = None
    target_language: Optional[str] = None
    proficiency_level: Optional[str] = None
    notification_time: Optional[str] = None
    is_premium: Optional[bool] = None
    onboarding_completed: Optional[bool] = None

class UserResponse(BaseModel):
    id: str
    email: str
    native_language: str
    target_language: str
    proficiency_level: str
    stories_generated_this_month: int = 0
    words_saved_count: int = 0
    is_premium: bool = False
    notification_time: Optional[str] = "09:00"
    current_streak: int = 0
    last_activity_date: Optional[str] = None
    onboarding_completed: bool = False
    created_at: str

class StoryCreate(BaseModel):
    language: str
    level: str
    topic: str
    content_type: str = "Story"
    custom_topic: Optional[str] = None

class StoryResponse(BaseModel):
    id: str
    user_id: str
    title: str
    content: str
    language: str
    level: str
    topic: str
    content_type: str
    created_at: str

class WordCreate(BaseModel):
    word: str
    context_sentence: str
    source_story_id: Optional[str] = None
    source_language: str
    native_language: str

class WordResponse(BaseModel):
    id: str
    user_id: str
    word: str
    translation: str
    context_sentence: str
    source_story_id: Optional[str] = None
    date_saved: str
    next_review_date: str
    mastery_level: int = 0
    review_history: List[Dict[str, Any]] = []
    created_at: str

class ReviewSubmit(BaseModel):
    word_id: str
    correct: bool

class TranslationRequest(BaseModel):
    word: str
    source_language: str
    target_language: str

# ============= HELPER FUNCTIONS =============

def generate_session_id():
    return str(uuid.uuid4())

async def get_llm_response(prompt: str, system_message: str = "You are a helpful language learning assistant.") -> str:
    """Get response from LLM using Emergent integration"""
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=generate_session_id(),
            system_message=system_message
        )
        chat.with_model("openai", "gpt-4.1")
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        return response
    except Exception as e:
        logger.error(f"LLM error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

def calculate_next_review_date(mastery_level: int) -> str:
    """Calculate next review date based on spaced repetition schedule"""
    intervals = {
        0: 1,    # Next day
        1: 3,    # +3 days
        2: 7,    # +7 days
        3: 14,   # +14 days
        4: 30,   # +30 days
        5: 90,   # +90 days
        6: 150,  # +150 days
        7: 365,  # +365 days
        8: 9999  # Mastered
    }
    days = intervals.get(mastery_level, 1)
    next_date = datetime.utcnow() + timedelta(days=days)
    return next_date.strftime("%Y-%m-%d")

def update_streak(user: dict) -> dict:
    """Update user streak based on activity"""
    today = datetime.utcnow().strftime("%Y-%m-%d")
    last_activity = user.get('last_activity_date')
    
    if last_activity == today:
        # Already active today
        return user
    
    yesterday = (datetime.utcnow() - timedelta(days=1)).strftime("%Y-%m-%d")
    
    if last_activity == yesterday:
        # Consecutive day, increment streak
        user['current_streak'] = user.get('current_streak', 0) + 1
    elif last_activity != today:
        # Streak broken
        user['current_streak'] = 1
    
    user['last_activity_date'] = today
    return user

# ============= AUTH ENDPOINTS =============

@api_router.post("/auth/register", response_model=UserResponse)
async def register(user_data: UserCreate):
    """Register a new user"""
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "email": user_data.email,
        "password": user_data.password,  # In production, hash this!
        "native_language": user_data.native_language,
        "target_language": user_data.target_language,
        "proficiency_level": user_data.proficiency_level,
        "stories_generated_this_month": 0,
        "words_saved_count": 0,
        "is_premium": False,
        "notification_time": "09:00",
        "current_streak": 0,
        "last_activity_date": None,
        "onboarding_completed": False,
        "created_at": datetime.utcnow().isoformat()
    }
    
    await db.users.insert_one(user)
    
    # Remove password from response
    del user['password']
    return UserResponse(**user)

@api_router.post("/auth/login", response_model=UserResponse)
async def login(credentials: UserLogin):
    """Login user"""
    user = await db.users.find_one({
        "email": credentials.email,
        "password": credentials.password
    })
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Update streak
    user = update_streak(user)
    await db.users.update_one({"id": user['id']}, {"$set": user})
    
    # Remove password and _id from response
    if '_id' in user:
        del user['_id']
    if 'password' in user:
        del user['password']
    
    return UserResponse(**user)

@api_router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str):
    """Get user by ID"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if '_id' in user:
        del user['_id']
    if 'password' in user:
        del user['password']
    
    return UserResponse(**user)

@api_router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, update_data: UserUpdate):
    """Update user settings"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    
    if update_dict:
        await db.users.update_one({"id": user_id}, {"$set": update_dict})
        user.update(update_dict)
    
    if '_id' in user:
        del user['_id']
    if 'password' in user:
        del user['password']
    
    return UserResponse(**user)

# ============= STORY ENDPOINTS =============

@api_router.post("/stories/generate", response_model=StoryResponse)
async def generate_story(user_id: str, story_data: StoryCreate):
    """Generate a new story using AI"""
    # Get user
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check free tier limits
    if not user.get('is_premium', False) and user.get('stories_generated_this_month', 0) >= 5:
        raise HTTPException(status_code=403, detail="Free tier limit reached. Upgrade to premium for unlimited stories.")
    
    topic = story_data.custom_topic or story_data.topic
    
    # Generate story using AI
    prompt = f"""Generate a {story_data.content_type} in {story_data.language} at {story_data.level} proficiency level about {topic}. 
Write 400-600 words using natural, conversational language appropriate for a {story_data.level} learner. 
Make it engaging and realistic. Do not include English translations or explanations.
Start directly with the story content."""

    content = await get_llm_response(prompt, "You are a language learning content creator. Generate engaging content in the specified language.")
    
    # Generate title
    title_prompt = f"Generate a short title (3-6 words) in {story_data.language} for this {story_data.content_type} about {topic}. Return only the title, nothing else."
    title = await get_llm_response(title_prompt)
    title = title.strip().strip('"\'')
    
    # Create story record
    story_id = str(uuid.uuid4())
    story = {
        "id": story_id,
        "user_id": user_id,
        "title": title,
        "content": content,
        "language": story_data.language,
        "level": story_data.level,
        "topic": topic,
        "content_type": story_data.content_type,
        "created_at": datetime.utcnow().isoformat()
    }
    
    await db.stories.insert_one(story)
    
    # Update user stats
    await db.users.update_one(
        {"id": user_id},
        {"$inc": {"stories_generated_this_month": 1}}
    )
    
    # Update streak
    user = update_streak(user)
    await db.users.update_one({"id": user_id}, {"$set": {
        "current_streak": user['current_streak'],
        "last_activity_date": user['last_activity_date']
    }})
    
    if '_id' in story:
        del story['_id']
    
    return StoryResponse(**story)

@api_router.get("/stories/{user_id}", response_model=List[StoryResponse])
async def get_user_stories(user_id: str, limit: int = 50):
    """Get all stories for a user"""
    stories = await db.stories.find({"user_id": user_id}).sort("created_at", -1).limit(limit).to_list(limit)
    
    result = []
    for story in stories:
        if '_id' in story:
            del story['_id']
        result.append(StoryResponse(**story))
    
    return result

@api_router.get("/stories/single/{story_id}", response_model=StoryResponse)
async def get_story(story_id: str):
    """Get a single story by ID"""
    story = await db.stories.find_one({"id": story_id})
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    
    if '_id' in story:
        del story['_id']
    
    return StoryResponse(**story)

@api_router.delete("/stories/{story_id}")
async def delete_story(story_id: str):
    """Delete a story"""
    result = await db.stories.delete_one({"id": story_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Story not found")
    return {"message": "Story deleted successfully"}

# ============= WORD ENDPOINTS =============

@api_router.post("/words/translate")
async def translate_word(request: TranslationRequest):
    """Translate a single word"""
    prompt = f"Translate the word '{request.word}' from {request.source_language} to {request.target_language}. Return ONLY the translation, no explanations or additional text."
    
    translation = await get_llm_response(prompt)
    return {"word": request.word, "translation": translation.strip()}

@api_router.post("/words/save", response_model=WordResponse)
async def save_word(user_id: str, word_data: WordCreate):
    """Save a word to user's dictionary"""
    # Get user
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check free tier limits
    if not user.get('is_premium', False) and user.get('words_saved_count', 0) >= 100:
        raise HTTPException(status_code=403, detail="Free tier limit reached. Upgrade to premium for unlimited word saving.")
    
    # Check if word already saved
    existing = await db.words.find_one({
        "user_id": user_id,
        "word": word_data.word.lower()
    })
    
    if existing:
        if '_id' in existing:
            del existing['_id']
        return WordResponse(**existing)
    
    # Get translation
    prompt = f"Translate the word '{word_data.word}' from {word_data.source_language} to {word_data.native_language}. Return ONLY the translation, no explanations."
    translation = await get_llm_response(prompt)
    
    # Create word record
    word_id = str(uuid.uuid4())
    today = datetime.utcnow().strftime("%Y-%m-%d")
    
    word = {
        "id": word_id,
        "user_id": user_id,
        "word": word_data.word.lower(),
        "translation": translation.strip(),
        "context_sentence": word_data.context_sentence,
        "source_story_id": word_data.source_story_id,
        "date_saved": today,
        "next_review_date": calculate_next_review_date(0),
        "mastery_level": 0,
        "review_history": [],
        "created_at": datetime.utcnow().isoformat()
    }
    
    await db.words.insert_one(word)
    
    # Update user stats
    await db.users.update_one(
        {"id": user_id},
        {"$inc": {"words_saved_count": 1}}
    )
    
    # Update streak
    user = update_streak(user)
    await db.users.update_one({"id": user_id}, {"$set": {
        "current_streak": user['current_streak'],
        "last_activity_date": user['last_activity_date']
    }})
    
    if '_id' in word:
        del word['_id']
    
    return WordResponse(**word)

@api_router.get("/words/{user_id}", response_model=List[WordResponse])
async def get_user_words(user_id: str, filter_type: str = "all"):
    """Get all words for a user"""
    query = {"user_id": user_id}
    
    if filter_type == "learning":
        query["mastery_level"] = {"$lt": 8}
    elif filter_type == "mastered":
        query["mastery_level"] = {"$gte": 8}
    
    words = await db.words.find(query).sort("date_saved", -1).to_list(1000)
    
    result = []
    for word in words:
        if '_id' in word:
            del word['_id']
        result.append(WordResponse(**word))
    
    return result

@api_router.delete("/words/{word_id}")
async def delete_word(word_id: str, user_id: str):
    """Delete a word from dictionary"""
    word = await db.words.find_one({"id": word_id})
    if not word:
        raise HTTPException(status_code=404, detail="Word not found")
    
    await db.words.delete_one({"id": word_id})
    
    # Decrement user word count
    await db.users.update_one(
        {"id": user_id},
        {"$inc": {"words_saved_count": -1}}
    )
    
    return {"message": "Word deleted successfully"}

# ============= REVIEW ENDPOINTS =============

@api_router.get("/reviews/due/{user_id}")
async def get_due_reviews(user_id: str):
    """Get words due for review today"""
    today = datetime.utcnow().strftime("%Y-%m-%d")
    
    words = await db.words.find({
        "user_id": user_id,
        "next_review_date": {"$lte": today},
        "mastery_level": {"$lt": 8}
    }).to_list(100)
    
    result = []
    for word in words:
        if '_id' in word:
            del word['_id']
        result.append(WordResponse(**word))
    
    return {"count": len(result), "words": result}

@api_router.post("/reviews/submit")
async def submit_review(user_id: str, review: ReviewSubmit):
    """Submit a review result"""
    word = await db.words.find_one({"id": review.word_id})
    if not word:
        raise HTTPException(status_code=404, detail="Word not found")
    
    # Update word based on review result
    if review.correct:
        new_mastery = min(word.get('mastery_level', 0) + 1, 8)
    else:
        new_mastery = 0  # Reset on incorrect
    
    # Add to review history
    review_entry = {
        "date": datetime.utcnow().isoformat(),
        "correct": review.correct,
        "mastery_before": word.get('mastery_level', 0),
        "mastery_after": new_mastery
    }
    
    review_history = word.get('review_history', [])
    review_history.append(review_entry)
    
    # Update word
    await db.words.update_one(
        {"id": review.word_id},
        {"$set": {
            "mastery_level": new_mastery,
            "next_review_date": calculate_next_review_date(new_mastery),
            "review_history": review_history
        }}
    )
    
    # Save review record
    review_record = {
        "id": str(uuid.uuid4()),
        "word_id": review.word_id,
        "user_id": user_id,
        "correct": review.correct,
        "reviewed_at": datetime.utcnow().isoformat()
    }
    await db.reviews.insert_one(review_record)
    
    # Update streak
    user = await db.users.find_one({"id": user_id})
    if user:
        user = update_streak(user)
        await db.users.update_one({"id": user_id}, {"$set": {
            "current_streak": user['current_streak'],
            "last_activity_date": user['last_activity_date']
        }})
    
    return {
        "success": True,
        "new_mastery_level": new_mastery,
        "next_review_date": calculate_next_review_date(new_mastery)
    }

# ============= STATS ENDPOINTS =============

@api_router.get("/stats/{user_id}")
async def get_user_stats(user_id: str):
    """Get comprehensive user statistics"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Count words by mastery
    total_words = await db.words.count_documents({"user_id": user_id})
    mastered_words = await db.words.count_documents({"user_id": user_id, "mastery_level": {"$gte": 8}})
    learning_words = await db.words.count_documents({"user_id": user_id, "mastery_level": {"$lt": 8}})
    
    # Count due reviews
    today = datetime.utcnow().strftime("%Y-%m-%d")
    due_reviews = await db.words.count_documents({
        "user_id": user_id,
        "next_review_date": {"$lte": today},
        "mastery_level": {"$lt": 8}
    })
    
    # Count total stories
    total_stories = await db.stories.count_documents({"user_id": user_id})
    
    # Get recent reviews (last 7 days)
    week_ago = (datetime.utcnow() - timedelta(days=7)).isoformat()
    recent_reviews = await db.reviews.count_documents({
        "user_id": user_id,
        "reviewed_at": {"$gte": week_ago}
    })
    
    # Calculate accuracy (last 30 days)
    month_ago = (datetime.utcnow() - timedelta(days=30)).isoformat()
    recent_review_list = await db.reviews.find({
        "user_id": user_id,
        "reviewed_at": {"$gte": month_ago}
    }).to_list(1000)
    
    if recent_review_list:
        correct_count = sum(1 for r in recent_review_list if r.get('correct'))
        accuracy = round((correct_count / len(recent_review_list)) * 100, 1)
    else:
        accuracy = 0
    
    return {
        "total_words": total_words,
        "mastered_words": mastered_words,
        "learning_words": learning_words,
        "due_reviews": due_reviews,
        "total_stories": total_stories,
        "current_streak": user.get('current_streak', 0),
        "reviews_this_week": recent_reviews,
        "accuracy_rate": accuracy,
        "stories_this_month": user.get('stories_generated_this_month', 0),
        "is_premium": user.get('is_premium', False)
    }

# ============= HEALTH CHECK =============

@api_router.get("/")
async def root():
    return {"message": "FluentStory API is running", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
