<script setup>
const { value } = defineProps({
  value: [String, Number, Boolean, Array, Object],
})

const getDisplayValue = (value) => {
  // We run JSON.stringify on everything to properly display values
  // This ensures objects, arrays, and primitives all display correctly
  return JSON.stringify(value)
}
</script>

<template>
  <template v-if="Array.isArray(value)">
    <code
      v-for="(item, attributeIdx) in value"
      :key="attributeIdx"
      class="!text-xs text-wrap break-all"
    >
      {{ getDisplayValue(item) }}
    </code>
  </template>

  <code v-else class="!text-xs text-wrap break-all">
    {{ getDisplayValue(value) }}
  </code>
</template>
