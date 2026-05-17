import { render, screen } from '@testing-library/react'
import Home from './page'

test('営業日報システムのタイトルが表示される', () => {
  render(<Home />)
  expect(screen.getByText('営業日報システム')).toBeInTheDocument()
})
