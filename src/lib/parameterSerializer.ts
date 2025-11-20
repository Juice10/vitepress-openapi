import type { OpenAPIV3 } from '@scalar/openapi-types'
import type { ParameterValue } from '../types'

/**
 * Serializes a parameter value according to OpenAPI parameter style and explode settings
 * @see https://swagger.io/docs/specification/serialization/
 */
export function serializeParameter(
  parameter: OpenAPIV3.ParameterObject,
  value: ParameterValue,
): Record<string, string> | null {
  if (value === undefined || value === null || value === '') {
    return null
  }

  const name = parameter.name
  if (!name) {
    return null
  }

  const style = parameter.style || getDefaultStyle(parameter.in)
  const explode = parameter.explode !== undefined ? parameter.explode : getDefaultExplode(style)

  // Handle simple scalar values
  if (typeof value !== 'object') {
    return { [name]: String(value) }
  }

  // Handle object values
  if (!Array.isArray(value) && typeof value === 'object') {
    return serializeObject(name, value, style, explode)
  }

  // Handle array values
  if (Array.isArray(value)) {
    return serializeArray(name, value, style, explode)
  }

  return { [name]: String(value) }
}

/**
 * Get default style based on parameter location
 */
function getDefaultStyle(parameterIn: string | undefined): string {
  switch (parameterIn) {
    case 'query':
    case 'cookie':
      return 'form'
    case 'path':
    case 'header':
      return 'simple'
    default:
      return 'form'
  }
}

/**
 * Get default explode value based on style
 */
function getDefaultExplode(style: string): boolean {
  return style === 'form'
}

/**
 * Serialize object values based on style and explode
 */
function serializeObject(
  name: string,
  value: Record<string, ParameterValue>,
  style: string,
  explode: boolean,
): Record<string, string> {
  const result: Record<string, string> = {}

  switch (style) {
    case 'deepObject':
      // deepObject: color[R]=100&color[G]=200&color[B]=150
      for (const [key, val] of Object.entries(value)) {
        if (val !== undefined && val !== null && val !== '') {
          result[`${name}[${key}]`] = String(val)
        }
      }
      break

    case 'form':
      if (explode) {
        // form explode=true: R=100&G=200&B=150
        for (const [key, val] of Object.entries(value)) {
          if (val !== undefined && val !== null && val !== '') {
            result[key] = String(val)
          }
        }
      } else {
        // form explode=false: color=R,100,G,200,B,150
        const pairs: string[] = []
        for (const [key, val] of Object.entries(value)) {
          if (val !== undefined && val !== null && val !== '') {
            pairs.push(key, String(val))
          }
        }
        if (pairs.length > 0) {
          result[name] = pairs.join(',')
        }
      }
      break

    case 'simple':
      if (explode) {
        // simple explode=true: R=100,G=200,B=150
        const pairs: string[] = []
        for (const [key, val] of Object.entries(value)) {
          if (val !== undefined && val !== null && val !== '') {
            pairs.push(`${key}=${val}`)
          }
        }
        if (pairs.length > 0) {
          result[name] = pairs.join(',')
        }
      } else {
        // simple explode=false: R,100,G,200,B,150
        const pairs: string[] = []
        for (const [key, val] of Object.entries(value)) {
          if (val !== undefined && val !== null && val !== '') {
            pairs.push(key, String(val))
          }
        }
        if (pairs.length > 0) {
          result[name] = pairs.join(',')
        }
      }
      break

    default:
      // Fallback to JSON string
      result[name] = JSON.stringify(value)
  }

  return result
}

/**
 * Serialize array values based on style and explode
 */
function serializeArray(
  name: string,
  value: ParameterValue[],
  style: string,
  explode: boolean,
): Record<string, string> {
  const result: Record<string, string> = {}

  switch (style) {
    case 'form':
      if (explode) {
        // form explode=true: color=blue&color=black&color=brown
        // Return as a single key with array notation for proper serialization
        result[name] = value.filter(v => v !== undefined && v !== null && v !== '').map(String).join(',')
      } else {
        // form explode=false: color=blue,black,brown
        result[name] = value.filter(v => v !== undefined && v !== null && v !== '').map(String).join(',')
      }
      break

    case 'spaceDelimited':
      // spaceDelimited: color=blue%20black%20brown
      result[name] = value.filter(v => v !== undefined && v !== null && v !== '').map(String).join(' ')
      break

    case 'pipeDelimited':
      // pipeDelimited: color=blue|black|brown
      result[name] = value.filter(v => v !== undefined && v !== null && v !== '').map(String).join('|')
      break

    case 'simple':
      // simple: blue,black,brown
      result[name] = value.filter(v => v !== undefined && v !== null && v !== '').map(String).join(',')
      break

    default:
      result[name] = value.filter(v => v !== undefined && v !== null && v !== '').map(String).join(',')
  }

  return result
}
