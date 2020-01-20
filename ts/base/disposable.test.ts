import { IDisposable, using } from '../node';
import { expect } from 'chai';

describe('disposable', () => {
  describe('using', () => {
    let disposed: boolean;
    let disposable: IDisposable;
    beforeEach(() => {
      disposed = false;
      disposable = { dispose: () => (disposed = true) };
    });

    it('disposes after sync call', () => {
      const v = using(disposable, d => {
        expect(d).to.equal(disposable);
        expect(disposed).to.be.false;
        return 42;
      });

      expect(v).to.equal(42);
      expect(disposed).to.be.true;
    });

    it('disposes after sync throw', () => {
      const err = new Error();
      try {
        using(disposable, () => {
          throw err;
        });
        throw new Error('expected to throw');
      } catch (e) {
        expect(e).to.equal(err);
      }

      expect(disposed).to.be.true;
    });

    it('disposes after promise resolve', async () => {
      const v = await using(disposable, async () => {
        await Promise.resolve();
        expect(disposed).to.be.false;
        return 42;
      });

      expect(v).to.equal(42);
      expect(disposed).to.be.true;
    });

    it('disposes after promise reject', async () => {
      const err = new Error();
      try {
        await using(disposable, async () => {
          await Promise.resolve();
          expect(disposed).to.be.false;
          throw err;
        });
        throw new Error('expected to throw');
      } catch (e) {
        expect(e).to.equal(err);
      }

      expect(disposed).to.be.true;
    });
  });
});
