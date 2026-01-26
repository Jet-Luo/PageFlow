'use client'

import EmojiPicker, { Theme } from 'emoji-picker-react'
import { useTheme } from 'next-themes'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface IconPickerProps {
  onChange: (icon: string) => void
  children: React.ReactNode
  asChild?: boolean
}

export const IconPicker = ({ onChange, children, asChild }: IconPickerProps) => {
  const { resolvedTheme } = useTheme()
  const currentTheme = (resolvedTheme || 'light') as keyof typeof themeMap
  const themeMap = {
    dark: Theme.DARK,
    light: Theme.LIGHT,
    system: Theme.AUTO
  }
  const theme = themeMap[currentTheme] || Theme.LIGHT

  return (
    <Popover>
      <PopoverTrigger asChild={asChild}>{children}</PopoverTrigger>
      <PopoverContent className="w-full border-none p-0 shadow-none">
        <EmojiPicker height={350} theme={theme} onEmojiClick={(data) => onChange(data.emoji)} />
      </PopoverContent>
    </Popover>
    // <EmojiPicker
    //   onEmojiClick={(emojiData) => onChange(emojiData.emoji)}
    //   theme={themeMap[currentTheme]}
    //   lazyLoadEmojis={true}
    //   searchPlaceHolder="Search emoji..."
    //   skinTonesDisabled={true}
    //   previewConfig={{
    //     showPreview: false,
    //     showSkinTones: false
    //   }}
    //   categoriesToShow={[
    //     'smileys_people',
    //     'animals_nature',
    //     'food_drink',
    //     'travel_places',
    //     'activities',
    //     'objects',
    //     'symbols',
    //     'flags'
    //   ]}
    //   width={300}
    //   height={400}
    //   emojiStyle="native"
    //   disableAutoFocus={true}
    //   groupNames={{ smileys_people: 'PEOPLE' }}
    // >
    //   {asChild ? children : <div>{children}</div>}
    // </EmojiPicker>
  )
}
