export interface BaseComponentProps {
  class?: string
  style?: string | Record<string, any>
}

export interface ButtonProps extends BaseComponentProps {
  label?: string
  icon?: string
  severity?: 'secondary' | 'success' | 'info' | 'warning' | 'help' | 'danger' | 'contrast'
  size?: 'small' | 'large'
  disabled?: boolean
  loading?: boolean
  variant?: 'outlined' | 'text' | 'link'
}

export interface ComponentEmits {
  click: [event: MouseEvent]
}
