// Fixed Dropdown.tsx - Mengatasi error "Text strings must be rendered within a <Text> component"

import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput } from 'react-native';
import { moderateScale } from '@/utils/styling';
import { colors } from '@/constants/theme';
import { CaretDown } from 'phosphor-react-native';

interface DropdownDataItem {
  id: number | string;
  name: string;
}

interface DropdownProps {
  label: string;
  data: DropdownDataItem[];
  selectedValue: string | null;
  placeholder: string;
  onSelect: (value: string | null, id: number | string | null) => void;
  disabled?: boolean;
  searchable?: boolean;
}

const Dropdown = ({ label, data, selectedValue, placeholder, onSelect, disabled = false, searchable = false }: DropdownProps) => {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');

  const handleSelect = (item: DropdownDataItem) => {
    onSelect(item.name, item.id);
    setOpen(false);
    setQuery('');
  };

  const filteredData = React.useMemo(() => {
    if (!searchable || !query) {
      return data;
    }
    return data.filter(item =>
      item.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [data, query, searchable]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={[styles.dropdown, disabled && styles.disabled]}
        onPress={() => {
          if (!disabled) {
            setOpen(!open);
            if (!open) setQuery('');
          }
        }}
        disabled={disabled}
      >
        <Text style={[styles.text, !selectedValue && styles.placeholder, disabled && styles.disabledText]}>
          {selectedValue || placeholder}
        </Text>
        <CaretDown size={moderateScale(20)} color={disabled ? colors.neutral300 : colors.neutral500} />
      </Pressable>

      {open && !disabled && (
        <View style={styles.dropdownContent}>
          {searchable && (
            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              placeholderTextColor={colors.neutral400}
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              keyboardType="default"
              returnKeyType="search"
              blurOnSubmit={false}
              onSubmitEditing={() => {
                if (filteredData.length > 0) {
                  handleSelect(filteredData[0]);
                }
              }}
            />
          )}
          <ScrollView 
            style={styles.list} 
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            {filteredData.length > 0 ? (
              filteredData.map(item => (
                <Pressable
                  key={item.id}
                  onPress={() => handleSelect(item)}
                  style={styles.listItem}
                >
                  <Text style={styles.listItemText}>{item.name}</Text>
                </Pressable>
              ))
            ) : (
              <View style={styles.listItem}>
                <Text style={[styles.listItemText, styles.noResultsText]}>No results found</Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: moderateScale(8),
  },
  label: {
    marginBottom: moderateScale(6),
    color: colors.neutral700,
    fontWeight: '600',
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral300,
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
    backgroundColor: colors.white,
  },
  text: {
    fontSize: moderateScale(14),
    color: colors.neutral900,
    flex: 1, // Add this to prevent text overflow
  },
  placeholder: {
    color: colors.neutral400,
  },
  dropdownContent: {
    borderWidth: 1,
    borderColor: colors.neutral300,
    borderRadius: moderateScale(8),
    marginTop: moderateScale(4),
    backgroundColor: colors.white,
    overflow: 'hidden',
    elevation: 3, // Add shadow on Android
    shadowColor: '#000', // Add shadow on iOS
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  searchInput: {
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral200,
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    fontSize: moderateScale(14),
    color: colors.neutral900,
  },
  list: {
    maxHeight: moderateScale(150),
  },
  listItem: {
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral100,
  },
  listItemText: {
    fontSize: moderateScale(14),
    color: colors.neutral900,
  },
  noResultsText: {
    textAlign: 'center',
    fontStyle: 'italic',
    color: colors.neutral500,
  },
  disabled: {
    backgroundColor: colors.neutral100,
    borderColor: colors.neutral200,
  },
  disabledText: {
    color: colors.neutral400,
  },
});

export default Dropdown;