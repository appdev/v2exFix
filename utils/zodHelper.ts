export const stripString = (value: unknown) => {
  if (typeof value === 'string') {
    value = value.trim()
    return value === '' ? undefined : value
  }
  return value
}

export const stripStringToNumber = (value: unknown) => {
  const str = stripString(value)
  return typeof str === 'string' ? +str : str
}
