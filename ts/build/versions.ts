export const minNodeVersion = 10;

/**
 * @hidden
 */
export interface IVersion {
  major: number;
  minor: number;
  patch: number;
}

/**
 * @hidden
 */
export const parseVersion = (version: string): IVersion => {
  const [, major, minor, patch] = /^v([0-9]+)\.([0-9]+)\.([0-9]+)/.exec(version) || [];
  return { major: Number(major), minor: Number(minor), patch: Number(patch) };
};

export const compareVersion = (a: IVersion, b: IVersion) =>
  a.major - b.major || a.minor - b.minor || a.patch - b.patch;
