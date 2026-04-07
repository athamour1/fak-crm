<template>
  <q-dialog v-model="open" maximized transition-show="slide-up" transition-hide="slide-down">
    <q-card class="bom-dialog column" style="height: 100vh;">

      <!-- Header -->
      <q-card-section class="row items-center q-pb-none bom-header">
        <q-icon name="picture_as_pdf" color="deep-orange" size="24px" class="q-mr-sm" />
        <span class="text-h6">Bill of Materials Preview</span>
        <q-space />
        <q-btn no-caps rounded flat round dense icon="close" v-close-popup />
      </q-card-section>

      <q-separator />

      <!-- iframe preview -->
      <div class="col" style="min-height: 0; overflow: hidden;">
        <iframe
          ref="iframeRef"
          :src="blobUrl"
          style="width: 100%; height: 100%; border: none;"
          @load="onIframeLoad"
        />
      </div>

      <q-separator />

      <!-- Action buttons -->
      <q-card-actions align="right" class="q-pa-md q-gutter-sm">
        <q-btn no-caps rounded flat label="Close" v-close-popup />
        <q-btn
          no-caps rounded unelevated
          color="primary" icon="print" label="Print"
          :disable="!iframeReady"
          @click="printBom"
        />
        <q-btn
          no-caps rounded unelevated
          color="deep-orange" icon="save_alt" label="Save as PDF"
          :disable="!iframeReady"
          @click="savePdf"
        />
      </q-card-actions>

    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';
import { useQuasar } from 'quasar';

const props = defineProps<{ modelValue: boolean; html: string }>();
const emit  = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>();

const $q = useQuasar();
const iframeRef  = ref<HTMLIFrameElement | null>(null);
const blobUrl    = ref('');
const iframeReady = ref(false);

const open = ref(props.modelValue);

watch(() => props.modelValue, (v) => {
  open.value = v;
  if (v && props.html) buildBlob();
});

watch(open, (v) => emit('update:modelValue', v));

function buildBlob() {
  if (blobUrl.value) URL.revokeObjectURL(blobUrl.value);
  iframeReady.value = false;
  const blob = new Blob([props.html], { type: 'text/html;charset=utf-8' });
  blobUrl.value = URL.createObjectURL(blob);
}

function onIframeLoad() {
  iframeReady.value = true;
}

function printBom() {
  iframeRef.value?.contentWindow?.print();
}

function savePdf() {
  // The page <title> inside the iframe becomes the suggested filename.
  // Trigger print — user selects "Save as PDF" as destination.
  iframeRef.value?.contentWindow?.print();
  $q.notify({
    type: 'info',
    message: 'Select "Save as PDF" as the printer destination. The filename will be the kit name.',
    timeout: 5000,
  });
}

onUnmounted(() => {
  if (blobUrl.value) URL.revokeObjectURL(blobUrl.value);
});
</script>

<style scoped lang="css">
.bom-dialog {
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
}
</style>
