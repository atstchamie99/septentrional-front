export const MAX_TABLE_COLUMN_WIDTH = 4096
export const MAX_TABLE_COLUMN_WIDTH_ENTRIES = 32

/**
 * Normalise le format colwidth produit par Tiptap en une courte liste
 * d'entiers strictement positifs et bornés.
 */
export const normalizeTableColumnWidths = (value: string | null): number[] | null => {
  if (!value) return null

  const entries = value.split(',').map(entry => entry.trim())
  if (
    entries.length === 0
    || entries.length > MAX_TABLE_COLUMN_WIDTH_ENTRIES
    || entries.some(entry => !/^[1-9]\d*$/.test(entry))
  ) {
    return null
  }

  const widths = entries.map(Number)
  if (widths.some(width => width > MAX_TABLE_COLUMN_WIDTH)) {
    return null
  }

  return widths
}
