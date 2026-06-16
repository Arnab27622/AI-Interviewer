import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './app/store';
import App from './App';
import { describe, it, expect } from 'vitest';

describe('App Component', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Provider store={store}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Provider>
    );
    expect(container).toBeTruthy();
  });
});
