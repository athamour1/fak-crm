<template>
  <q-page class="inspection-page column no-wrap ot-page-shell">

    <!-- ══ PINNED TOP ══════════════════════════════════════════════════════════ -->
    <div class="inspection-top q-px-md q-pt-md">

      <!-- ── Header ─────────────────────────────────────────────────────────── -->
      <div class="row items-center q-mb-sm">
        <q-btn no-caps rounded flat round dense icon="arrow_back" :to="backRoute" class="q-mr-sm" />
        <div class="col">
          <div class="text-h5" v-if="kit">{{ kit.name }}</div>
          <q-skeleton v-else type="text" width="180px" />
          <div class="text-caption text-grey-6" v-if="kit">
            <q-icon name="location_on" size="14px" />
            {{ kit.location || $t('kits.noLocation') }}
              &nbsp;·&nbsp;{{ $t('inspections.itemsCount', { n: kit.kitItems.length }) }}
          </div>
        </div>
      </div>

      <!-- ── Expiry warning banner ─────────────────────────────────────────── -->
      <q-banner
        v-if="!loading && expiredItemCount > 0"
        :class="[$q.dark.isActive ? 'bg-red-9 text-red-2' : 'bg-red-1 text-red-9', 'ot-state-banner q-mb-sm']"
      >
        <template #avatar><q-icon name="dangerous" /></template>
        <strong>{{ expiredItemCount }}</strong> {{ $t('inspections.expiredInKit', { n: expiredItemCount }) }}
      </q-banner>

      <!-- ── Progress bar ───────────────────────────────────────────────────── -->
      <q-card flat bordered :class="['q-mb-sm', $q.dark.isActive ? 'bg-blue-10' : 'bg-blue-1']" v-if="kit && !loading">
        <q-card-section class="q-py-md row items-center q-gutter-md">
          <div class="text-caption" :class="$q.dark.isActive ? 'text-blue-2' : 'text-blue-9'">
            <strong>{{ checkedCount }}</strong> / {{ items.length }} items reviewed
          </div>
          <q-linear-progress
            :value="items.length ? checkedCount / items.length : 0"
            color="primary" class="col"
            style="height: 8px; border-radius: 4px;"
          />
          <div class="text-caption" :class="$q.dark.isActive ? 'text-blue-2' : 'text-blue-9'">
            {{ Math.round(items.length ? (checkedCount / items.length) * 100 : 0) }}%
          </div>
        </q-card-section>
      </q-card>

      <!-- ── Search & filter bar ───────────────────────────────────────────── -->
      <div v-if="!loading && kit" class="row q-col-gutter-sm q-mb-sm items-center">
        <div class="col-12 col-sm-6">
          <q-input
            v-model="search"
            :placeholder="$t('common.search')"
            outlined dense clearable
            bg-color="transparent"
          >
            <template #prepend><q-icon name="search" /></template>
          </q-input>
        </div>
        <div class="col-12 col-sm-6 row q-gutter-xs">
          <q-btn-toggle
            v-model="filter"
            spread no-caps unelevated dense class="col"
            :options="[
              { label: $t('common.all'), value: 'all' },
              { label: $t('inspections.pending'), value: 'pending' },
              { label: $t('dashboard.expired'), value: 'expired' },
            ]"
            color="grey-4"
            text-color="dark"
            toggle-color="primary"
            toggle-text-color="white"
          />
        </div>
      </div>

    </div>

    <!-- ══ SCROLLABLE ITEMS ════════════════════════════════════════════════════ -->
    <div class="inspection-scroll q-px-md">

      <!-- Loading skeletons -->
      <div v-if="loading" class="q-gutter-md q-pb-md">
        <q-card v-for="n in 4" :key="n" flat bordered>
          <q-card-section>
            <q-skeleton type="text" width="50%" class="q-mb-sm" />
            <q-skeleton type="rect" height="80px" />
          </q-card-section>
        </q-card>
      </div>

      <div v-else class="q-gutter-md q-pb-md">
        <div v-if="filteredItems.length === 0" class="ot-empty-state q-my-md">
          {{ $t('inspections.noItemsMatch') }}
        </div>

        <q-card
          v-for="item in filteredItems"
          :key="item.kitItemId"
          flat bordered
          :class="[
            'item-card',
            item.checked ? 'item-card--done' : '',
            !item.currentIsValid ? 'item-card--expired' : '',
          ]"
        >
          <q-card-section class="q-pb-sm">
            <div class="row items-start no-wrap">
              <div class="col">
                <div class="text-subtitle2 text-weight-bold">{{ item.name }}</div>
                <div class="text-caption text-grey-6">{{ item.category }}</div>
              </div>
              <div class="row q-gutter-xs items-center">
                <q-badge
                  :color="item.currentIsValid ? 'positive' : 'negative'"
                  :label="item.currentIsValid ? $t('common.active') : $t('dashboard.expired')"
                />
                <q-icon v-if="item.checked" name="check_circle" color="positive" size="20px" />
              </div>
            </div>
            <div class="row q-gutter-md q-mt-xs text-caption text-grey-7">
              <span>
                <q-icon name="inventory_2" size="12px" />
                {{ $t('inspections.previousQty') }}: <strong>{{ item.previousQuantity }}</strong>
              </span>
              <span v-if="item.previousExpiry">
                <q-icon name="event" size="12px" />
                {{ $t('inspections.previousExpiry') }}: <strong>{{ formatDate(item.previousExpiry) }}</strong>
              </span>
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section class="q-pt-sm">
            <div class="row q-col-gutter-sm">
              <div class="col-12 col-sm-4">
                <q-input
                  v-model.number="item.quantityFound"
                  :label="$t('inspections.quantityFound')" type="number"
                  outlined dense min="0"
                  :rules="nonNegativeRules"
                  @update:model-value="markChecked(item)"
                >
                  <template #prepend><q-icon name="numbers" /></template>
                </q-input>
              </div>
              <div class="col-12 col-sm-4">
                <q-input
                  v-model="item.expirationDateFound"
                  :label="$t('inspections.expirationDate')" outlined dense type="date" clearable
                  @update:model-value="markChecked(item)"
                >
                  <template #prepend><q-icon name="event" /></template>
                </q-input>
              </div>
              <div class="col-12 col-sm-4">
                <q-input
                  v-model="item.notes"
                  :label="$t('inspections.itemNotes')" outlined dense clearable
                  @update:model-value="markChecked(item)"
                >
                  <template #prepend><q-icon name="notes" /></template>
                </q-input>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

    </div>

    <!-- ══ PINNED BOTTOM ═══════════════════════════════════════════════════════ -->
    <div v-if="!loading && kit" class="inspection-bottom q-px-md q-pb-md">
      <StickyActionBar class="q-mb-md">
        <template #left>
          <q-btn no-caps rounded flat :label="$t('common.cancel')" :to="backRoute" />
        </template>
        <template #right>
          <q-btn no-caps rounded
            unelevated color="primary" size="md"
            icon="send" :label="$t('inspections.submitInspection')"
            :loading="submitting"
            :disable="!items.length"
            @click="submitInspection"
          />
        </template>
      </StickyActionBar>
      <q-input
        v-model="overallNotes"
        :label="$t('inspections.overallNotes')"
        outlined dense
        type="textarea"
        autogrow
        :rows="2"
        class="q-mb-sm"
      >
        <template #prepend><q-icon name="edit_note" /></template>
      </q-input>
    </div>

    <!-- ── Success overlay ─────────────────────────────────────────────────────── -->
    <q-dialog v-model="successDialog" persistent>
      <q-card class="text-center q-pa-lg" style="min-width: 300px">
        <q-icon name="check_circle" color="positive" size="64px" class="q-mb-md" />
        <div class="text-h6 q-mb-xs">{{ $t('inspections.inspectionSubmitted') }}</div>
        <div class="text-body2 text-grey-7 q-mb-lg">
          <template v-if="offlineQueued">
            <q-icon name="cloud_off" color="warning" class="q-mr-xs" />
            {{ $t('offline.queuedSubmission') }}
          </template>
          <template v-else>
            {{ $t('inspections.savedForKit', { name: kit?.name }) }}
          </template>
        </div>
        <q-btn no-caps rounded unelevated color="primary" :label="$t('common.backToDashboard')" :to="backRoute" />
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, type RouteLocationRaw } from 'vue-router';
import { useQuasar, date } from 'quasar';
import { useI18n } from 'vue-i18n';
import { kitsApi, inspectionsApi, type Kit } from 'src/services/api';
import { useNotify } from 'src/composables/useNotify';
import { useOnline } from 'src/composables/useOnline';
import { useSyncQueue } from 'src/stores/sync-queue.store';
import StickyActionBar from 'components/StickyActionBar.vue';
import { useFormValidation } from 'src/composables/useFormValidation';

const { t } = useI18n();
const validation = useFormValidation(t);
const $q = useQuasar();
const { isOnline } = useOnline();
const syncQueue = useSyncQueue();
const nonNegativeRules = [validation.nonNegative()];

const route = useRoute();
const notify = useNotify();
const kitId = route.params.id as string;
const backRoute: RouteLocationRaw = route.query['from'] === 'qr'
  ? { name: 'dashboard' }
  : { name: 'my-kit-detail', params: { id: kitId } };

const kit = ref<Kit | null>(null);
const loading = ref(false);
const submitting = ref(false);
const overallNotes = ref('');
const successDialog = ref(false);
const offlineQueued = ref(false);

// ── Per-item inspection state ────────────────────────────────────────────────

interface ItemState {
  kitItemId: string;
  name: string;
  category: string;
  previousQuantity: number;
  previousExpiry: string | null;
  currentIsValid: boolean;
  // editable fields
  quantityFound: number;
  expirationDateFound: string;
  notes: string;
  checked: boolean; // user has touched at least one field
}

const items = ref<ItemState[]>([]);
const search = ref('');
const filter = ref<'all' | 'pending' | 'expired'>('all');

const filteredItems = computed(() => {
  const q = search.value.trim().toLowerCase();
  return items.value.filter((item) => {
    if (filter.value === 'pending' && item.checked) return false;
    if (filter.value === 'expired' && item.currentIsValid) return false;
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });
});

const checkedCount = computed(() => items.value.filter((i) => i.checked).length);
const expiredItemCount = computed(() => items.value.filter((i) => !i.currentIsValid).length);

function buildItems(k: Kit) {
  items.value = k.kitItems.map((ki) => ({
    kitItemId: ki.id,
    name: ki.name,
    category: ki.category ?? '',
    previousQuantity: ki.quantity,
    previousExpiry: ki.expirationDate ?? null,
    currentIsValid: ki.isValid,
    quantityFound: ki.quantity,
    expirationDateFound: ki.expirationDate ? ki.expirationDate.slice(0, 10) : '',
    notes: ki.notes ?? '',
    checked: false,
  }));
}

function markChecked(item: ItemState) {
  item.checked = true;
}

function formatDate(iso: string) {
  return date.formatDate(iso, 'DD MMM YYYY');
}

// ── Submit ───────────────────────────────────────────────────────────────────

async function submitInspection() {
  submitting.value = true;
  const payload = {
    kitId,
    ...(overallNotes.value && { notes: overallNotes.value }),
    items: items.value.map((i) => ({
      kitItemId: i.kitItemId,
      quantityFound: i.quantityFound,
      expirationDateFound: i.expirationDateFound || null,
      ...(i.notes && { notes: i.notes }),
    })),
  };

  if (!isOnline.value) {
    syncQueue.enqueue({
      type: 'inspection',
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...payload,
    });
    offlineQueued.value = true;
    successDialog.value = true;
    submitting.value = false;
    return;
  }

  try {
    await inspectionsApi.submit(payload);
    successDialog.value = true;
  } catch (e) {
    notify.error(e, t('inspections.submitInspection'));
  } finally {
    submitting.value = false;
  }
}

// ── Load ─────────────────────────────────────────────────────────────────────

onMounted(async () => {
  loading.value = true;
  try {
    const { data } = await kitsApi.get(kitId);
    kit.value = data;
    buildItems(data);
  } catch (e) {
    notify.error(e, !isOnline.value ? t('offline.noCachedData') : 'Failed to load kit');
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped lang="css">
.inspection-page {
  /* fill the full viewport height that q-page gives us */
  height: 100%;
}

.inspection-top {
  flex-shrink: 0;
}

.inspection-scroll {
  flex: 1 1 0;
  overflow-y: auto;
  min-height: 0;
}

.inspection-bottom {
  flex-shrink: 0;
}

/* Centre the content on wide screens */
.inspection-page,
.inspection-top,
.inspection-scroll,
.inspection-bottom {
  max-width: 860px;
  width: 100%;
  margin-left: auto;
  margin-right: auto;
}

.item-card {
  border-radius: var(--ot-radius-sm);
  transition: border-color 0.2s;
}

.item-card--done {
  border-color: var(--ot-color-success) !important;
  background: #f6fff8;
}
.item-card--expired {
  border-color: var(--ot-color-danger) !important;
  background: #fff5f5;
}
.body--dark .item-card--done {
  border-color: var(--ot-color-success) !important;
  background: #0a1f0a;
}
.body--dark .item-card--expired {
  border-color: var(--ot-color-danger) !important;
  background: #1f0a0a;
}
</style>
