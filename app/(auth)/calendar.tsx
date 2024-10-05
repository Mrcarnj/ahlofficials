import { View, Text } from 'react-native'
import React from 'react'

const calendar = () => {
  return (
    <View>
      <Text>calendar</Text>
    </View>
  )
}

export const mockEvents = {
    '2024-09-15': { customStyles: { container: { backgroundColor: '#ff6600' } }, description: 'Event 1' },
  '2024-09-20': { customStyles: { container: { backgroundColor: '#ff6600' } }, description: 'Event 2' },
  '2024-09-25': { customStyles: { container: { backgroundColor: '#ff6600' } }, description: 'Event 3' },
  '2024-10-05': { customStyles: { container: { backgroundColor: '#ff6600' } }, description: 'Event 4' },
  '2024-10-10': { customStyles: { container: { backgroundColor: '#ff6600' } }, description: 'Event 5' },
  '2024-10-15': { customStyles: { container: { backgroundColor: '#ff6600' } }, description: 'Event 6' },
};

export default calendar