import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { NicheFinder } from '../components/NicheFinder'

// Mock the store
vi.mock('../store', () => ({
  useStore: () => ({
    updateProfile: vi.fn(),
    setView: vi.fn(),
  }),
}))

describe('NicheFinder Workflow', () => {
  it('navigates through the niche finder quiz and applies a result', async () => {
    render(<NicheFinder />)
    
    // Check if the first question is rendered
    expect(screen.getByText(/What could you talk about for 3 hours straight/i)).toBeInTheDocument()
    
    // Fill in the first answer
    const input1 = screen.getByPlaceholderText(/e.g. personal finance/i)
    fireEvent.change(input1, { target: { value: 'Tech Gadgets' } })
    
    // Click Next
    const nextBtn = screen.getByText(/Next/i)
    fireEvent.click(nextBtn)
    
    // Wait for Question 2
    expect(await screen.findByText(/What do people ask your advice on/i)).toBeInTheDocument()
    const input2 = screen.getByPlaceholderText(/e.g. investing/i)
    fireEvent.change(input2, { target: { value: 'PC Building' } })
    fireEvent.click(screen.getByText(/Next/i))

    // Wait for Question 3 (Platform)
    expect(await screen.findByText(/Which platform fits your content style/i)).toBeInTheDocument()
    fireEvent.click(screen.getByText('YouTube'))
    fireEvent.click(screen.getByText(/Next/i))

    // Wait for Question 4 (Time)
    expect(await screen.findByText(/How much time can you commit/i)).toBeInTheDocument()
    fireEvent.click(screen.getByText('5–10 hrs/week'))
    fireEvent.click(screen.getByText(/Next/i))

    // Wait for Question 5 (Style)
    expect(await screen.findByText(/What's your natural content style/i)).toBeInTheDocument()
    fireEvent.click(screen.getByText('Educator'))
    fireEvent.click(screen.getByText(/Next/i))

    // Wait for Question 6 (Audience)
    expect(await screen.findByText(/Who's your target audience/i)).toBeInTheDocument()
    fireEvent.click(screen.getByText('Beginners'))
    fireEvent.click(screen.getByText(/Next/i))

    // Wait for Question 7 (Goal)
    expect(await screen.findByText(/What is your primary goal/i)).toBeInTheDocument()
    fireEvent.click(screen.getByText('Build audience'))
    fireEvent.click(screen.getByText(/Next/i))

    // Wait for Question 8 (Income)
    expect(await screen.findByText(/What income target are you aiming for/i)).toBeInTheDocument()
    fireEvent.click(screen.getByText('₹1L–5L/mo'))
    
    // Final button
    const finishBtn = screen.getByText(/See My Niche/i)
    fireEvent.click(finishBtn)

    // Results screen
    expect(await screen.findByText(/Your 3 Niche Recommendations/i)).toBeInTheDocument()
    
    // Check if "Apply" button exists and click it
    const applyButtons = screen.getAllByText(/Apply/i)
    expect(applyButtons.length).toBeGreaterThan(0)
    fireEvent.click(applyButtons[0])
  })
})
