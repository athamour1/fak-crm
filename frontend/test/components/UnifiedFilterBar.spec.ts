import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import UnifiedFilterBar from 'src/components/UnifiedFilterBar.vue';

describe('UnifiedFilterBar', () => {
  it('emits search and kit filter updates', async () => {
    const wrapper = mount(UnifiedFilterBar, {
      props: {
        search: '',
        kitOptions: [{ label: 'Kit A', value: 'kit-a' }],
        searchPlaceholder: 'Search...',
        kitLabel: 'Filter by Kit',
      },
      global: {
        stubs: {
          'q-input': {
            template: '<button data-test="search" @click="$emit(\'update:model-value\', \'mask\')" />',
          },
          'q-select': {
            template: '<button data-test="kit" @click="$emit(\'update:model-value\', \'kit-a\')" />',
          },
          'q-icon': true,
        },
      },
    });

    await wrapper.get('[data-test="search"]').trigger('click');
    await wrapper.get('[data-test="kit"]').trigger('click');

    expect(wrapper.emitted('update:search')?.[0]).toEqual(['mask']);
    expect(wrapper.emitted('update:kitId')?.[0]).toEqual(['kit-a']);
  });
});
