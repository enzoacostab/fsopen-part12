import React from 'react'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import Todo from './Todo'

test('renders content', () => {
  const note = {
    text: 'example',
    done: true
  }

  render(<Todo todo={note} />)

  const element = screen.getByText('example')
  expect(element).toBeDefined()
})