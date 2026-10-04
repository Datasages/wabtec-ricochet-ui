// Loaded by react-scripts before every test file.
import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

// react-router 7 uses TextEncoder at import time, and the jsdom that ships with
// react-scripts 5's Jest does not provide it. Node's implementation is the one
// browsers' matches.
Object.assign(global, { TextEncoder, TextDecoder });
