import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES } from '../constants/theme';

interface DropdownOption {
  id: string;
  label: string;
  icon?: string;
}

interface DropdownProps {
  label?: string;
  options: DropdownOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  placeholder?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  label,
  options,
  selectedValue,
  onSelect,
  placeholder = 'Select an option',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((opt) => opt.id === selectedValue);

  const handleSelect = (value: string) => {
    onSelect(value);
    setIsOpen(false);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.8}
      >
        <Text style={[styles.triggerText, !selectedOption && styles.placeholder]}>
          {selectedOption?.label || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color={COLORS.black} />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsOpen(false)}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View style={styles.dropdown}>
                <Text style={styles.dropdownTitle}>{label || 'SELECT'}</Text>
                <FlatList
                  data={options}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.option,
                        item.id === selectedValue && styles.selectedOption,
                      ]}
                      onPress={() => handleSelect(item.id)}
                    >
                      {item.icon && (
                        <Ionicons
                          name={item.icon as any}
                          size={20}
                          color={
                            item.id === selectedValue
                              ? COLORS.white
                              : COLORS.black
                          }
                        />
                      )}
                      <Text
                        style={[
                          styles.optionText,
                          item.id === selectedValue && styles.selectedOptionText,
                        ]}
                      >
                        {item.label}
                      </Text>
                      {item.id === selectedValue && (
                        <Ionicons
                          name="checkmark"
                          size={20}
                          color={COLORS.white}
                          style={styles.checkmark}
                        />
                      )}
                    </TouchableOpacity>
                  )}
                  style={styles.list}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.black,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  triggerText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.black,
    fontWeight: '500',
  },
  placeholder: {
    color: COLORS.textMuted,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  dropdown: {
    backgroundColor: COLORS.white,
    borderWidth: 3,
    borderColor: COLORS.black,
    width: '100%',
    maxHeight: 400,
    padding: SPACING.md,
  },
  dropdownTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '900',
    color: COLORS.black,
    marginBottom: SPACING.md,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  list: {
    flexGrow: 0,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  selectedOption: {
    backgroundColor: COLORS.black,
  },
  optionText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.black,
    fontWeight: '500',
  },
  selectedOptionText: {
    color: COLORS.white,
  },
  checkmark: {
    marginLeft: 'auto',
  },
});
