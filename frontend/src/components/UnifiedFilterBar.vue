<template>
  <div class="row q-col-gutter-sm items-center ot-filter-bar">
    <div class="col-12 col-md-7">
      <q-input
        :model-value="search"
        outlined
        dense
        clearable
        debounce="250"
        :placeholder="searchPlaceholder"
        @update:model-value="onSearchChange"
      >
        <template #prepend>
          <q-icon name="search" />
        </template>
      </q-input>
    </div>

    <div class="col-12 col-md-5" v-if="showKitFilter">
      <q-select
        :model-value="kitId"
        :options="kitOptions"
        :label="kitLabel"
        dense
        outlined
        clearable
        emit-value
        map-options
        @update:model-value="onKitChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Option {
  label: string;
  value: string;
}

withDefaults(
  defineProps<{
    search: string;
    kitId?: string | undefined;
    kitOptions?: Option[];
    showKitFilter?: boolean;
    searchPlaceholder: string;
    kitLabel: string;
  }>(),
  {
    kitOptions: () => [],
    showKitFilter: true,
  },
);

const emit = defineEmits<{
  'update:search': [value: string];
  'update:kitId': [value?: string];
}>();

function onSearchChange(value: string | number | null) {
  emit('update:search', typeof value === 'string' ? value : '');
}

function onKitChange(value: string | null) {
  emit('update:kitId', value ?? undefined);
}
</script>

<style scoped>
.ot-filter-bar {
  width: 100%;
}
</style>
