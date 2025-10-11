/*
 * App 
 *  React  TDD 
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './app';

describe('App ', () => {
  describe('', () => {
    it('', () => {
      render(<App />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Phaser 3 + React 19 + TypeScript');
    });

    it('', () => {
      render(<App />);

      const title = screen.getByText(/Phaser 3.*React 19.*TypeScript/);
      expect(title).toBeInTheDocument();
    });

    it('', () => {
      const { container } = render(<App />);

      const mainDiv = container.querySelector('div');
      expect(mainDiv).toBeInTheDocument();
    });
  });

  describe('', () => {
    it('', () => {
      render(<App />);

      // 
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it('', () => {
      render(<App />);

      const heading = screen.getByRole('heading');
      expect(heading.tagName).toBe('H1');
    });
  });

  describe('', () => {
    it(' app ', () => {
      render(<App />);
      const root = screen.getByTestId('app-root');
      expect(root).toBeInTheDocument();
      // 
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      // Normal / Vertical Slice/
      const buttons = root.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThanOrEqual(2);
      // 
      const startBtn = screen.queryByTestId('start-game');
      expect(startBtn).toBeTruthy();
    });
  });
});
