import { isTemporaryUri, photoFileName } from '@/files/photo-paths';

describe('isTemporaryUri', () => {
  it('detects URIs from the picker or camera', () => {
    expect(isTemporaryUri('file:///data/user/0/cache/ImagePicker/abc.jpg')).toBe(true);
    expect(isTemporaryUri('content://media/external/images/1')).toBe(true);
  });

  it('treats relative paths as already saved', () => {
    expect(isTemporaryUri('photos/p1-123.jpg')).toBe(false);
  });
});

describe('photoFileName', () => {
  it('keeps the original extension', () => {
    expect(photoFileName('p1', 'file:///x/y/IMG_1.PNG', 42)).toBe('p1-42.png');
  });

  it('defaults to jpg when the URI has no extension', () => {
    expect(photoFileName('p1', 'content://media/external/images/1', 42)).toBe('p1-42.jpg');
  });
});
