<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">
      <q-icon name="warning" class="q-mr-sm" color="negative" />My Incident Reports
    </div>

    <q-card flat bordered style="overflow: hidden;">
      <q-table
        :rows="reports" :columns="columns" row-key="id"
        :loading="loading" flat :pagination="{ rowsPerPage: 20 }"
      >
        <template #loading>
          <q-inner-loading showing>
            <div class="full-width">
              <q-list separator>
                <q-item v-for="n in 6" :key="n" class="q-py-sm">
                  <q-item-section><q-skeleton type="text" width="20%" /></q-item-section>
                  <q-item-section><q-skeleton type="text" width="35%" /></q-item-section>
                  <q-item-section><q-skeleton type="text" width="25%" /></q-item-section>
                  <q-item-section side><q-skeleton type="QBadge" /></q-item-section>
                </q-item>
              </q-list>
            </div>
          </q-inner-loading>
        </template>
        <template #body="props">
          <q-tr :props="props">
            <q-td auto-width>
              <q-btn no-caps rounded flat dense round size="sm"
                :icon="props.expand ? 'expand_less' : 'expand_more'"
                @click="props.expand = !props.expand"
              />
            </q-td>
            <q-td key="createdAt" :props="props">{{ formatDate(props.row.createdAt) }}</q-td>
            <q-td key="kit" :props="props">{{ props.row.kit.name }}</q-td>
            <q-td key="itemCount" :props="props">
              <q-badge color="negative" :label="props.row.items.length" />
            </q-td>
          </q-tr>

          <q-tr v-show="props.expand" :props="props" :class="$q.dark.isActive ? 'bg-red-10' : 'bg-red-1'">
            <q-td colspan="100%" style="padding: 0;">
              <div class="q-pa-sm" style="max-height: 260px; overflow-y: auto;">
                <div v-if="props.row.description" class="q-mb-sm text-caption text-grey-8">
                  <strong>Description:</strong> {{ props.row.description }}
                </div>
                <q-markup-table dense flat bordered separator="cell">
                  <thead>
                    <tr :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-grey-2'">
                      <th class="text-left">Item</th>
                      <th>Qty Used</th>
                      <th class="text-left">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="li in props.row.items" :key="li.id">
                      <td>{{ li.kitItem.name }}</td>
                      <td class="text-center text-negative text-weight-bold">{{ li.quantityUsed }}</td>
                      <td>{{ li.notes ?? '—' }}</td>
                    </tr>
                  </tbody>
                </q-markup-table>
              </div>
            </q-td>
          </q-tr>
        </template>

        <template #no-data>
          <div class="full-width column flex-center q-pa-xl text-grey-5">
            <q-icon name="warning" size="48px" class="q-mb-sm" />
            No incident reports submitted yet.
          </div>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuasar, date, type QTableColumn } from 'quasar';

const $q = useQuasar();
import { incidentsApi, type IncidentReport } from 'src/services/api';
import { useNotify } from 'src/composables/useNotify';

const notify = useNotify();
const reports = ref<IncidentReport[]>([]);
const loading = ref(false);

function formatDate(iso: string) {
  return date.formatDate(iso, 'DD MMM YYYY, HH:mm');
}

const columns: QTableColumn[] = [
  { name: 'expand',    label: '',      field: () => '',    align: 'center', style: 'width: 48px' },
  { name: 'createdAt', label: 'Date',  field: 'createdAt', sortable: true,  align: 'left' },
  { name: 'kit',       label: 'Kit',   field: 'kit',       align: 'left' },
  { name: 'itemCount', label: 'Items', field: 'items',     align: 'center' },
];

onMounted(async () => {
  loading.value = true;
  try {
    const { data } = await incidentsApi.list();
    reports.value = data;
  } catch (e) {
    notify.error(e, 'Failed to load incident reports');
  } finally {
    loading.value = false;
  }
});
</script>
