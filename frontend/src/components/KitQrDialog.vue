<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <q-card style="min-width: 320px" class="text-center">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">QR Code — {{ kitName }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <canvas ref="canvasRef" style="border-radius: 8px" />
        <div class="text-caption text-grey-6 q-mt-sm">Scan to open kit actions page</div>
      </q-card-section>

      <q-card-actions align="center" class="q-pb-md">
        <q-btn unelevated color="primary" icon="download" label="Download PNG" @click="download" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import QRCode from 'qrcode';

const props = defineProps<{
  modelValue: boolean;
  kitId: string;
  kitName: string;
}>();
defineEmits<{ (e: 'update:modelValue', v: boolean): void }>();

const router = useRouter();
const canvasRef = ref<HTMLCanvasElement | null>(null);

const url = () => {
  const resolved = router.resolve({ name: 'kit-landing', params: { id: props.kitId } });
  return `${window.location.origin}${resolved.href}`;
};

watch(
  () => props.modelValue,
  async (open) => {
    if (!open) return;
    await nextTick();
    if (canvasRef.value) {
      await QRCode.toCanvas(canvasRef.value, url(), { width: 260, margin: 2 });
    }
  },
);

function download() {
  if (!canvasRef.value) return;
  const a = document.createElement('a');
  a.href = canvasRef.value.toDataURL('image/png');
  a.download = `kit-${props.kitId}.png`;
  a.click();
}
</script>
