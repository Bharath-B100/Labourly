import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../components/theme';
import { Select } from '../components/ui';

const categories = [
  {
    code: 'CONTRACTOR',
    name: 'Contractor',
    copy: 'Build with the right people.',
    icon: 'construct-outline',
  },
  {
    code: 'SITE_ENGINEER',
    name: 'Engineer',
    copy: 'Find skilled support for your projects.',
    icon: 'business-outline',
  },
  {
    code: 'ARCHITECT',
    name: 'Architect',
    copy: 'Bring your designs to life with a crew.',
    icon: 'shapes-outline',
  },
] as const;

export function CustomerCategories({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { code: string; name: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <View style={{ gap: 12 }}>
      <Text
        accessibilityRole="header"
        style={{ fontSize: 24, fontWeight: '700', color: palette.ink }}
      >
        I am a
      </Text>
      <Text style={{ color: palette.ink }}>
        Choose your customer category. This does not change your account
        permissions.
      </Text>
      {categories
        .filter((category) =>
          options.some((option) => option.code === category.code),
        )
        .map((category) => (
          <Pressable
            key={category.code}
            accessibilityRole="radio"
            accessibilityLabel={category.name}
            accessibilityState={{ checked: value === category.code }}
            onPress={() => onChange(category.code)}
            style={{
              minHeight: 80,
              padding: 16,
              borderWidth: 1,
              borderColor: value === category.code ? palette.ink : palette.grey,
              backgroundColor:
                value === category.code ? palette.yellow : palette.white,
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Ionicons name={category.icon} size={28} color={palette.ink} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text
                style={{ color: palette.ink, fontWeight: '700', fontSize: 17 }}
              >
                {category.name}
              </Text>
              <Text style={{ color: palette.ink, fontSize: 13 }}>
                {category.copy}
              </Text>
            </View>
            <Ionicons
              name={
                value === category.code ? 'radio-button-on' : 'radio-button-off'
              }
              size={22}
              color={palette.ink}
            />
          </Pressable>
        ))}
      <Select
        label="Customer type"
        value={value}
        placeholder="Choose your customer type"
        options={options.map((option) => ({
          value: option.code,
          label: option.name,
        }))}
        onChange={onChange}
      />
    </View>
  );
}
