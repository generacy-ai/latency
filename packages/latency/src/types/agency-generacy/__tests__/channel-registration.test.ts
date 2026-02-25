import { describe, it, expect } from 'vitest';
import {
  ChannelRegistrationSchema,
  ChannelDiscoverySchema,
  parseChannelRegistration,
  safeParseChannelRegistration,
  parseChannelDiscovery,
  safeParseChannelDiscovery,
} from '../channel-registration.js';

describe('ChannelRegistrationSchema', () => {
  it('validates minimal registration', () => {
    const data = {
      channelId: 'my-channel',
      version: '1.0.0',
      owner: 'my-plugin',
      messageTypes: ['message.type1'],
    };
    expect(ChannelRegistrationSchema.parse(data)).toEqual(data);
  });

  it('validates full registration with description', () => {
    const data = {
      channelId: 'namespace:channel-name',
      version: '2.1.0',
      owner: 'some.plugin.namespace',
      messageTypes: ['ping', 'pong', 'data'],
      description: 'A bidirectional communication channel',
    };
    expect(ChannelRegistrationSchema.parse(data)).toEqual(data);
  });

  it('rejects empty channelId', () => {
    const data = {
      channelId: '',
      version: '1.0.0',
      owner: 'plugin',
      messageTypes: ['type1'],
    };
    expect(() => ChannelRegistrationSchema.parse(data)).toThrow();
  });

  it('rejects empty owner', () => {
    const data = {
      channelId: 'channel',
      version: '1.0.0',
      owner: '',
      messageTypes: ['type1'],
    };
    expect(() => ChannelRegistrationSchema.parse(data)).toThrow();
  });

  it('rejects empty messageTypes array', () => {
    const data = {
      channelId: 'channel',
      version: '1.0.0',
      owner: 'plugin',
      messageTypes: [],
    };
    expect(() => ChannelRegistrationSchema.parse(data)).toThrow();
  });

  it('rejects invalid version', () => {
    const data = {
      channelId: 'channel',
      version: 'invalid',
      owner: 'plugin',
      messageTypes: ['type1'],
    };
    expect(() => ChannelRegistrationSchema.parse(data)).toThrow();
  });

  it('accepts prerelease version', () => {
    const data = {
      channelId: 'channel',
      version: '1.0.0-beta.1',
      owner: 'plugin',
      messageTypes: ['type1'],
    };
    expect(ChannelRegistrationSchema.parse(data)).toEqual(data);
  });
});

describe('ChannelDiscoverySchema', () => {
  it('validates minimal discovery query', () => {
    const data = {
      channelId: 'my-channel',
    };
    expect(ChannelDiscoverySchema.parse(data)).toEqual(data);
  });

  it('validates discovery with exact version', () => {
    const data = {
      channelId: 'my-channel',
      version: '1.0.0',
    };
    expect(ChannelDiscoverySchema.parse(data)).toEqual(data);
  });

  it('validates discovery with version range (caret)', () => {
    const data = {
      channelId: 'my-channel',
      version: '^1.0.0',
    };
    expect(ChannelDiscoverySchema.parse(data)).toEqual(data);
  });

  it('validates discovery with version range (tilde)', () => {
    const data = {
      channelId: 'my-channel',
      version: '~1.2.0',
    };
    expect(ChannelDiscoverySchema.parse(data)).toEqual(data);
  });

  it('validates discovery with version range (>=)', () => {
    const data = {
      channelId: 'my-channel',
      version: '>=2.0.0',
    };
    expect(ChannelDiscoverySchema.parse(data)).toEqual(data);
  });

  it('rejects empty channelId', () => {
    const data = {
      channelId: '',
    };
    expect(() => ChannelDiscoverySchema.parse(data)).toThrow();
  });

  it('rejects invalid version range', () => {
    const data = {
      channelId: 'channel',
      version: 'not-a-version',
    };
    expect(() => ChannelDiscoverySchema.parse(data)).toThrow();
  });
});

describe('parse helpers', () => {
  describe('ChannelRegistration helpers', () => {
    const validRegistration = {
      channelId: 'channel',
      version: '1.0.0',
      owner: 'plugin',
      messageTypes: ['type1'],
    };

    it('parseChannelRegistration returns parsed data', () => {
      expect(parseChannelRegistration(validRegistration)).toEqual(validRegistration);
    });

    it('parseChannelRegistration throws for invalid data', () => {
      expect(() => parseChannelRegistration({ channelId: '' })).toThrow();
    });

    it('safeParseChannelRegistration returns success for valid data', () => {
      const result = safeParseChannelRegistration(validRegistration);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validRegistration);
      }
    });

    it('safeParseChannelRegistration returns error for invalid data', () => {
      const result = safeParseChannelRegistration({});
      expect(result.success).toBe(false);
    });
  });

  describe('ChannelDiscovery helpers', () => {
    const validDiscovery = {
      channelId: 'channel',
    };

    it('parseChannelDiscovery returns parsed data', () => {
      expect(parseChannelDiscovery(validDiscovery)).toEqual(validDiscovery);
    });

    it('parseChannelDiscovery throws for invalid data', () => {
      expect(() => parseChannelDiscovery({ channelId: '' })).toThrow();
    });

    it('safeParseChannelDiscovery returns success for valid data', () => {
      const result = safeParseChannelDiscovery(validDiscovery);
      expect(result.success).toBe(true);
    });

    it('safeParseChannelDiscovery returns error for invalid data', () => {
      const result = safeParseChannelDiscovery({});
      expect(result.success).toBe(false);
    });
  });
});
