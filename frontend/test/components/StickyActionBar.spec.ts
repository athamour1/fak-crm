import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import StickyActionBar from 'src/components/StickyActionBar.vue';

describe('StickyActionBar', () => {
  it('renders left and right slot content', () => {
    const wrapper = mount(StickyActionBar, {
      slots: {
        left: '<button>Cancel</button>',
        right: '<button>Submit</button>',
      },
    });

    expect(wrapper.text()).toContain('Cancel');
    expect(wrapper.text()).toContain('Submit');
  });
});
