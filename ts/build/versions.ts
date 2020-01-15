export const minNodeVersion = 10;

/**
 * @hidden
 */
export const getMajorVersion = (version: string): number => {
  const [, majorVersion] = /^v([0-9]+)/.exec(version) || [];
  return Number(majorVersion) ?? 0;
};
