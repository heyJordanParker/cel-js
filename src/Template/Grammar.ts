export const AT_CHAIN = '(?<![A-Za-z0-9_])@([A-Za-z_][A-Za-z0-9_]*(?:\\.[A-Za-z_][A-Za-z0-9_]*|\\[\\d+\\])*)'

export const ESCAPED_OPEN = '\\{{'

export const WHOLE_INERT = /^\s*\{\{\s*((?:(?!\}\}).)*?)\s*\}\}\s*$/s

export const WHOLE_EXECUTABLE = /^\s*\{\{\{\s*((?:(?!\}\}\}).)*?)\s*\}\}\}\s*$/s

export const SPANS = new RegExp(`\\\\\\{\\{|\\{\\{\\{\\s*(.*?)\\s*\\}\\}\\}|\\{\\{\\s*(.*?)\\s*\\}\\}|${AT_CHAIN}`, 'gs')
