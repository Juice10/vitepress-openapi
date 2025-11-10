<script setup lang="ts">
import { useI18n } from '@byjohann/vue-i18n'
import { computed, defineEmits, defineProps, onMounted, ref } from 'vue'
import { getPropertyExample } from '../../lib/examples/getPropertyExample'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../ui/select'

const props = defineProps({
  parameter: {
    type: Object,
    required: true,
  },
  modelValue: {
    type: [String, Number, Boolean, null, Array, Object, File],
    required: true,
  },
  compositeKey: {
    type: String,
    required: true,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  hideLabel: {
    type: Boolean,
    default: false,
  },
})

const emits = defineEmits([
  'update:modelValue',
  'update:enabled',
  'submit',
])

function handleInputChange(value: any) {
  if (!props.enabled) {
    emits('update:enabled', true)
  }

  emits('update:modelValue', value)
}

function isBinary(parameter: any) {
  return parameter.schema?.format === 'binary'
}

function inputType(parameter: any) {
  if (parameter.schema?.type === 'integer') {
    return 'number'
  }
  if (parameter.schema?.type === 'number') {
    return 'number'
  }
  if (isBinary(parameter)) {
    return 'file'
  }
  return 'text'
}

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target?.files?.[0]
  handleInputChange(file ?? null)
}

// Object parameter handling
const isObjectParameter = computed(() => {
  return props.parameter.schema?.type === 'object'
})

const objectEntries = ref<Array<{ key: string, value: string }>>([])

function initializeObjectEntries() {
  if (!isObjectParameter.value) return

  const example = getPropertyExample(props.parameter)
  if (example && typeof example === 'object' && !Array.isArray(example)) {
    objectEntries.value = Object.entries(example).map(([key, value]) => ({
      key,
      value: String(value)
    }))
  }

  if (objectEntries.value.length === 0) {
    objectEntries.value = [{ key: '', value: '' }]
  }

  updateObjectValue()
}

function addObjectEntry() {
  objectEntries.value.push({ key: '', value: '' })
}

function removeObjectEntry(index: number) {
  objectEntries.value.splice(index, 1)
  if (objectEntries.value.length === 0) {
    objectEntries.value = [{ key: '', value: '' }]
  }
  updateObjectValue()
}

function updateObjectValue() {
  const obj: Record<string, string> = {}
  for (const entry of objectEntries.value) {
    if (entry.key && entry.value) {
      obj[entry.key] = entry.value
    }
  }
  handleInputChange(obj)
}

onMounted(() => {
  if (props.parameter.schema?.enum) {
    emits('update:modelValue', getPropertyExample(props.parameter) ?? props.parameter.schema.enum[0])
  } else if (isObjectParameter.value) {
    initializeObjectEntries()
  }
})

const parameterExample = getPropertyExample(props.parameter)
const { t } = useI18n()
</script>

<template>
  <div class="grid gap-2 items-center" :class="{ 'grid-cols-2': !hideLabel, 'grid-cols-1': hideLabel }">
    <div v-if="!hideLabel" class="flex items-center gap-2">
      <Checkbox
        :id="`enable-${compositeKey}`"
        :name="`enable-${compositeKey}`"
        :model-value="enabled"
        variant="toggle"
        @update:model-value="emits('update:enabled', $event)"
      />

      <Label v-if="parameter.name" :for="compositeKey" class="text-sm font-bold space-x-2">
        <span>{{ parameter.name }}</span>
        <span
          v-if="parameter.required"
          class="text-sm text-destructive"
        >*</span>
      </Label>
    </div>

    <div
      class="flex items-center flex-grow gap-2"
      :class="{ 'opacity-50': !enabled }"
    >
      <Checkbox
        v-if="['boolean'].includes(parameter.schema?.type)"
        :id="compositeKey"
        :name="compositeKey"
        :model-value="String(modelValue) === '' ? 'indeterminate' : (modelValue as boolean)"
        @update:model-value="handleInputChange($event)"
        @keydown.enter="emits('submit')"
      />

      <Select
        v-else-if="parameter.schema?.enum"
        :id="compositeKey"
        :name="compositeKey"
        @update:model-value="handleInputChange($event)"
      >
        <SelectTrigger :aria-label="String(parameterExample ?? t('Select'))">
          <SelectValue :placeholder="String(parameterExample ?? t('Select'))" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem
              v-for="enumValue in parameter.schema.enum"
              :key="enumValue"
              :value="String(enumValue)"
            >
              {{ enumValue }}
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      <div v-else-if="isObjectParameter" class="flex-grow flex flex-col gap-2">
        <div
          v-for="(entry, index) in objectEntries"
          :key="index"
          class="flex items-center gap-2"
        >
          <Input
            v-model="entry.key"
            :placeholder="t('Key')"
            class="bg-muted flex-1"
            @update:model-value="updateObjectValue"
            @keydown.enter="emits('submit')"
          />
          <Input
            v-model="entry.value"
            :placeholder="t('Value')"
            class="bg-muted flex-1"
            @update:model-value="updateObjectValue"
            @keydown.enter="emits('submit')"
          />
          <Button
            v-if="objectEntries.length > 1"
            type="button"
            variant="ghost"
            size="icon"
            class="h-8 w-8"
            @click="removeObjectEntry(index)"
          >
            <span class="text-lg">−</span>
          </Button>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          class="w-full"
          @click="addObjectEntry"
        >
          {{ t('Add Field') }}
        </Button>
      </div>

      <div v-else class="flex-grow flex items-center gap-1">
        <template v-if="isBinary(parameter)">
          <Input
            :id="compositeKey"
            :name="compositeKey"
            type="file"
            class="bg-muted"
            @change="onFileChange"
          />
        </template>
        <template v-else>
          <Input
            :id="compositeKey"
            :name="compositeKey"
            :value="modelValue as any"
            :type="inputType(parameter)"
            :placeholder="String(parameterExample ?? '')"
            class="bg-muted"
            @update:model-value="handleInputChange($event)"
            @keydown.enter="emits('submit')"
          />
        </template>
      </div>
    </div>
  </div>
</template>
