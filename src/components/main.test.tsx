import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import MainPage from './main';
import { COOKIE_GUID_NAME, COOKIE_TOKEN_NAME, MarksError, checkAuth, getMarks } from '../utils/api';

jest.mock('../utils/api', () => ({
  ...jest.requireActual('../utils/api'),
  checkAuth: jest.fn(),
  getMarks: jest.fn(),
}));

const mockedCheckAuth = checkAuth as jest.MockedFunction<typeof checkAuth>;
const mockedGetMarks = getMarks as jest.MockedFunction<typeof getMarks>;

const showMainPage = () => {
  const setAuthenticated = jest.fn();
  render(
    <MemoryRouter>
      <MainPage setAuthenticated={setAuthenticated} />
    </MemoryRouter>,
  );
  return setAuthenticated;
};

describe('MainPage marks', () => {
  beforeEach(() => {
    document.cookie = `${COOKIE_TOKEN_NAME}=tok; path=/`;
    document.cookie = `${COOKIE_GUID_NAME}=guid-1; path=/`;
    mockedCheckAuth.mockResolvedValue(200);
  });

  afterEach(() => {
    jest.resetAllMocks();
    document.cookie = `${COOKIE_TOKEN_NAME}=; path=/; max-age=0`;
    document.cookie = `${COOKIE_GUID_NAME}=; path=/; max-age=0`;
  });

  test("loads the railroad's marks with the device credential and selects the first", async () => {
    mockedGetMarks.mockResolvedValue(['AMTK', 'CDTX']);

    showMainPage();

    expect(await screen.findByText('AMTK')).toBeInTheDocument();
    expect(mockedGetMarks).toHaveBeenCalledWith('tok', 'guid-1');
    expect(screen.queryByText('Could not load the railroad marks')).not.toBeInTheDocument();
  });

  // The marks route checks the full token, unlike the guid-only auth check, so
  // a device that passed the auth check can still be refused here.
  test('signs the device out when the marks route refuses it', async () => {
    mockedGetMarks.mockRejectedValue(new MarksError(401, 'refused'));

    const setAuthenticated = showMainPage();

    await waitFor(() => expect(setAuthenticated).toHaveBeenCalledWith(false));
    expect(document.cookie).not.toContain(`${COOKIE_TOKEN_NAME}=tok`);
  });

  // A railroad still below strolr-api 2.12.0 has no marks route (404). The page
  // must say so rather than show an empty list and a working button.
  test.each([
    ['a missing route', new MarksError(404, 'not found')],
    ['a server error', new MarksError(500, 'server error')],
    ['a network failure', new TypeError('Failed to fetch')],
  ])('reports %s and disables the check', async (_label, failure) => {
    mockedGetMarks.mockRejectedValue(failure);

    const setAuthenticated = showMainPage();

    expect(await screen.findByText('Could not load the railroad marks')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'CHECK COMM PATH' })).toBeDisabled();
    expect(setAuthenticated).not.toHaveBeenCalled();
  });
});
