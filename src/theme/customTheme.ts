/**
 * Custom Flowbite Theme
 * 
 * Customizes Flowbite React components to match the application's design system.
 * This theme provides consistent styling across all Flowbite components.
 */

import { createTheme } from 'flowbite-react';

export const customTheme = createTheme({
  button: {
    base: 'group relative flex items-stretch justify-center p-0.5 text-center font-medium transition-[color,background-color,border-color,text-decoration-color,fill,stroke,box-shadow] focus:z-10 focus:outline-none',
    fullSized: 'w-full',
    color: {
      primary: 'border border-transparent bg-blue-600 text-white focus:ring-4 focus:ring-blue-300 enabled:hover:bg-blue-700 dark:bg-blue-600 dark:focus:ring-blue-800 dark:enabled:hover:bg-blue-700',
      gray: 'border border-gray-300 bg-white text-gray-900 focus:ring-4 focus:ring-gray-100 enabled:hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:ring-gray-700 dark:enabled:hover:bg-gray-700 dark:enabled:hover:border-gray-700',
      info: 'border border-transparent bg-cyan-600 text-white focus:ring-4 focus:ring-cyan-300 enabled:hover:bg-cyan-700 dark:bg-cyan-600 dark:focus:ring-cyan-800 dark:enabled:hover:bg-cyan-700',
      success: 'border border-transparent bg-green-600 text-white focus:ring-4 focus:ring-green-300 enabled:hover:bg-green-700 dark:bg-green-600 dark:focus:ring-green-800 dark:enabled:hover:bg-green-700',
      failure: 'border border-transparent bg-red-600 text-white focus:ring-4 focus:ring-red-300 enabled:hover:bg-red-700 dark:bg-red-600 dark:focus:ring-red-900 dark:enabled:hover:bg-red-700',
      warning: 'border border-transparent bg-yellow-400 text-white focus:ring-4 focus:ring-yellow-300 enabled:hover:bg-yellow-500 dark:focus:ring-yellow-900',
      blue: 'border border-transparent bg-blue-600 text-white focus:ring-4 focus:ring-blue-300 enabled:hover:bg-blue-700 dark:bg-blue-600 dark:focus:ring-blue-800 dark:enabled:hover:bg-blue-700',
    },
    disabled: 'cursor-not-allowed opacity-50',
    isProcessing: 'cursor-wait',
    spinnerSlot: 'absolute top-0 flex h-full items-center',
    spinnerLeftPosition: {
      xs: 'left-2',
      sm: 'left-3',
      md: 'left-4',
      lg: 'left-5',
      xl: 'left-6',
    },
    gradient: {
      cyan: 'bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 text-white focus:ring-4 focus:ring-cyan-300 enabled:hover:bg-gradient-to-br dark:focus:ring-cyan-800',
      green: 'bg-gradient-to-r from-green-400 via-green-500 to-green-600 text-white focus:ring-4 focus:ring-green-300 enabled:hover:bg-gradient-to-br dark:focus:ring-green-800',
      pink: 'bg-gradient-to-r from-pink-400 via-pink-500 to-pink-600 text-white focus:ring-4 focus:ring-pink-300 enabled:hover:bg-gradient-to-br dark:focus:ring-pink-800',
      purple: 'bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 text-white focus:ring-4 focus:ring-purple-300 enabled:hover:bg-gradient-to-br dark:focus:ring-purple-800',
      red: 'bg-gradient-to-r from-red-400 via-red-500 to-red-600 text-white focus:ring-4 focus:ring-red-300 enabled:hover:bg-gradient-to-br dark:focus:ring-red-800',
    },
    gradientDuoTone: {
      cyanToBlue: 'bg-gradient-to-r from-cyan-500 to-cyan-500 text-white focus:ring-4 focus:ring-cyan-300 enabled:hover:bg-gradient-to-bl dark:focus:ring-cyan-800',
      greenToBlue: 'bg-gradient-to-br from-green-400 to-cyan-600 text-white focus:ring-4 focus:ring-green-200 enabled:hover:bg-gradient-to-bl dark:focus:ring-green-800',
      pinkToOrange: 'bg-gradient-to-br from-pink-500 to-orange-400 text-white focus:ring-4 focus:ring-pink-200 enabled:hover:bg-gradient-to-bl dark:focus:ring-pink-800',
      purpleToBlue: 'bg-gradient-to-br from-purple-600 to-cyan-500 text-white focus:ring-4 focus:ring-cyan-300 enabled:hover:bg-gradient-to-bl dark:focus:ring-cyan-800',
      purpleToPink: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white focus:ring-4 focus:ring-purple-200 enabled:hover:bg-gradient-to-l dark:focus:ring-purple-800',
      redToYellow: 'bg-gradient-to-r from-red-200 via-red-300 to-yellow-200 text-gray-900 focus:ring-4 focus:ring-red-100 enabled:hover:bg-gradient-to-bl dark:text-gray-900 dark:focus:ring-red-400',
      tealToLime: 'bg-gradient-to-r from-teal-200 to-lime-200 text-gray-900 focus:ring-4 focus:ring-lime-200 enabled:hover:bg-gradient-to-l enabled:hover:from-teal-200 enabled:hover:to-lime-200 enabled:hover:text-gray-900 dark:text-gray-900 dark:focus:ring-teal-700',
    },
    inner: {
      base: 'flex items-stretch transition-all duration-200',
      position: {
        none: '',
        start: 'rounded-r-none',
        middle: '!rounded-none',
        end: 'rounded-l-none',
      },
      outline: 'border border-transparent',
      isProcessingPadding: {
        xs: 'pl-8',
        sm: 'pl-10',
        md: 'pl-12',
        lg: 'pl-16',
        xl: 'pl-20',
      },
    },
    label: 'ml-2 inline-flex h-4 w-4 items-center justify-center rounded-full bg-cyan-200 text-xs font-semibold text-cyan-800',
    outline: {
      color: {
        gray: 'border border-gray-900 dark:border-white',
        default: 'border-0',
        light: '',
      },
      off: '',
      on: 'flex w-full justify-center bg-white text-gray-900 transition-all duration-75 ease-in group-enabled:group-hover:bg-opacity-0 group-enabled:group-hover:text-inherit dark:bg-gray-900 dark:text-white',
      pill: {
        off: 'rounded-lg',
        on: 'rounded-full',
      },
    },
    pill: {
      off: 'rounded-lg',
      on: 'rounded-full',
    },
    size: {
      xs: 'px-2 py-1 text-xs',
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-5 py-2.5 text-base',
      xl: 'px-6 py-3 text-base',
    },
  },
  badge: {
    root: {
      base: 'flex h-fit items-center gap-1 font-semibold',
      color: {
        info: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-200 dark:text-cyan-800 group-hover:bg-cyan-200 dark:group-hover:bg-cyan-300',
        gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 group-hover:bg-gray-200 dark:group-hover:bg-gray-600',
        failure: 'bg-red-100 text-red-800 dark:bg-red-200 dark:text-red-900 group-hover:bg-red-200 dark:group-hover:bg-red-300',
        success: 'bg-green-100 text-green-800 dark:bg-green-200 dark:text-green-900 group-hover:bg-green-200 dark:group-hover:bg-green-300',
        warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-200 dark:text-yellow-900 group-hover:bg-yellow-200 dark:group-hover:bg-yellow-300',
        indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-200 dark:text-indigo-900 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-300',
        purple: 'bg-purple-100 text-purple-800 dark:bg-purple-200 dark:text-purple-900 group-hover:bg-purple-200 dark:group-hover:bg-purple-300',
        pink: 'bg-pink-100 text-pink-800 dark:bg-pink-200 dark:text-pink-900 group-hover:bg-pink-200 dark:group-hover:bg-pink-300',
        blue: 'bg-blue-100 text-blue-800 dark:bg-blue-200 dark:text-blue-900 group-hover:bg-blue-200 dark:group-hover:bg-blue-300',
        cyan: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-200 dark:text-cyan-900 group-hover:bg-cyan-200 dark:group-hover:bg-cyan-300',
        dark: 'bg-gray-600 text-gray-100 dark:bg-gray-900 dark:text-gray-200 group-hover:bg-gray-500 dark:group-hover:bg-gray-700',
        light: 'bg-gray-200 text-gray-800 dark:bg-gray-400 dark:text-gray-900 group-hover:bg-gray-300 dark:group-hover:bg-gray-500',
        green: 'bg-green-100 text-green-800 dark:bg-green-200 dark:text-green-900 group-hover:bg-green-200 dark:group-hover:bg-green-300',
        lime: 'bg-lime-100 text-lime-800 dark:bg-lime-200 dark:text-lime-900 group-hover:bg-lime-200 dark:group-hover:bg-lime-300',
        red: 'bg-red-100 text-red-800 dark:bg-red-200 dark:text-red-900 group-hover:bg-red-200 dark:group-hover:bg-red-300',
        teal: 'bg-teal-100 text-teal-800 dark:bg-teal-200 dark:text-teal-900 group-hover:bg-teal-200 dark:group-hover:bg-teal-300',
        yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-200 dark:text-yellow-900 group-hover:bg-yellow-200 dark:group-hover:bg-yellow-300',
      },
      href: 'group',
      size: {
        xs: 'p-1 text-xs',
        sm: 'p-1.5 text-sm',
      },
    },
    icon: {
      off: 'rounded px-2 py-0.5',
      on: 'rounded-full p-1.5',
      size: {
        xs: 'h-3 w-3',
        sm: 'h-3.5 w-3.5',
      },
    },
  },
  toggleSwitch: {
    root: {
      base: 'group relative flex items-center rounded-lg focus:outline-none',
      active: {
        on: 'cursor-pointer',
        off: 'cursor-not-allowed opacity-50',
      },
      label: 'ml-3 text-sm font-medium text-gray-900 dark:text-gray-300',
    },
    toggle: {
      base: 'relative rounded-full border after:absolute after:rounded-full after:bg-white after:transition-all group-focus:ring-4 group-focus:ring-cyan-500/25',
      checked: {
        on: 'after:translate-x-full after:border-white rtl:after:-translate-x-full',
        off: 'border-gray-200 bg-gray-200 dark:border-gray-600 dark:bg-gray-700',
        color: {
          blue: 'border-cyan-700 bg-cyan-700',
          dark: 'bg-dark-700 border-dark-900',
          failure: 'border-red-900 bg-red-700',
          gray: 'border-gray-500 bg-gray-500',
          green: 'border-green-700 bg-green-600',
          light: 'bg-light-700 border-light-900',
          red: 'border-red-900 bg-red-700',
          purple: 'border-purple-900 bg-purple-700',
          success: 'border-green-500 bg-green-500',
          yellow: 'border-yellow-400 bg-yellow-400',
          warning: 'border-yellow-600 bg-yellow-600',
          cyan: 'border-cyan-500 bg-cyan-500',
          lime: 'border-lime-400 bg-lime-400',
          indigo: 'border-indigo-400 bg-indigo-400',
          teal: 'bg-gradient-to-r from-teal-400 via-teal-500 to-teal-600 hover:bg-gradient-to-br focus:ring-4',
          info: 'border-cyan-600 bg-cyan-600',
          pink: 'border-pink-600 bg-pink-600',
        },
      },
      sizes: {
        sm: 'h-5 w-9 min-w-9 after:left-px after:top-px after:h-4 after:w-4 rtl:after:right-px',
        md: 'h-6 w-11 min-w-11 after:left-px after:top-px after:h-5 after:w-5 rtl:after:right-px',
        lg: 'h-7 w-14 min-w-14 after:left-1 after:top-0.5 after:h-6 after:w-6 rtl:after:right-1',
      },
    },
  },
  select: {
    base: 'flex',
    addon: 'inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-200 px-3 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-400',
    field: {
      base: 'relative w-full',
      icon: {
        base: 'pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3',
        svg: 'h-5 w-5 text-gray-500 dark:text-gray-400',
      },
      select: {
        base: 'block w-full border disabled:cursor-not-allowed disabled:opacity-50',
        withIcon: {
          on: 'pl-10',
          off: '',
        },
        withAddon: {
          on: 'rounded-r-lg',
          off: 'rounded-lg',
        },
        withShadow: {
          on: 'shadow-sm dark:shadow-sm-light',
          off: '',
        },
        sizes: {
          sm: 'p-2 sm:text-xs',
          md: 'p-2.5 text-sm',
          lg: 'p-4 sm:text-base',
        },
        colors: {
          gray: 'border-gray-300 bg-gray-50 text-gray-900 focus:border-cyan-500 focus:ring-cyan-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-cyan-500 dark:focus:ring-cyan-500',
          info: 'border-cyan-500 bg-cyan-50 text-cyan-900 placeholder-cyan-700 focus:border-cyan-500 focus:ring-cyan-500 dark:border-cyan-400 dark:bg-cyan-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500',
          failure: 'border-red-500 bg-red-50 text-red-900 placeholder-red-700 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:bg-red-100 dark:focus:border-red-500 dark:focus:ring-red-500',
          warning: 'border-yellow-500 bg-yellow-50 text-yellow-900 placeholder-yellow-700 focus:border-yellow-500 focus:ring-yellow-500 dark:border-yellow-400 dark:bg-yellow-100 dark:focus:border-yellow-500 dark:focus:ring-yellow-500',
          success: 'border-green-500 bg-green-50 text-green-900 placeholder-green-700 focus:border-green-500 focus:ring-green-500 dark:border-green-400 dark:bg-green-100 dark:focus:border-green-500 dark:focus:ring-green-500',
        },
      },
    },
  },
  label: {
    root: {
      base: 'text-sm font-medium',
      disabled: 'opacity-50',
      colors: {
        default: 'text-gray-900 dark:text-white',
        info: 'text-cyan-500 dark:text-cyan-600',
        failure: 'text-red-700 dark:text-red-500',
        warning: 'text-yellow-500 dark:text-yellow-600',
        success: 'text-green-700 dark:text-green-500',
      },
    },
  },
  checkbox: {
    root: {
      base: 'h-4 w-4 rounded border border-gray-300 bg-gray-100 focus:ring-2 dark:border-gray-600 dark:bg-gray-700',
      color: {
        default: 'text-cyan-600 focus:ring-cyan-600 dark:ring-offset-gray-800 dark:focus:ring-cyan-600',
        dark: 'text-gray-800 focus:ring-gray-800 dark:ring-offset-gray-800 dark:focus:ring-gray-800',
        failure: 'text-red-600 focus:ring-red-600 dark:ring-offset-red-600 dark:focus:ring-red-600',
        gray: 'text-gray-900 focus:ring-gray-900 dark:ring-offset-gray-900 dark:focus:ring-gray-900',
        info: 'text-cyan-800 focus:ring-cyan-800 dark:ring-offset-gray-800 dark:focus:ring-cyan-800',
        light: 'text-gray-900 focus:ring-gray-900 dark:ring-offset-gray-900 dark:focus:ring-gray-900',
        purple: 'text-purple-600 focus:ring-purple-600 dark:ring-offset-purple-600 dark:focus:ring-purple-600',
        success: 'text-green-600 focus:ring-green-600 dark:ring-offset-green-600 dark:focus:ring-green-600',
        warning: 'text-yellow-400 focus:ring-yellow-400 dark:ring-offset-yellow-400 dark:focus:ring-yellow-400',
        blue: 'text-blue-700 focus:ring-blue-600 dark:ring-offset-blue-700 dark:focus:ring-blue-700',
        cyan: 'text-cyan-600 focus:ring-cyan-600 dark:ring-offset-cyan-600 dark:focus:ring-cyan-600',
        green: 'text-green-600 focus:ring-green-600 dark:ring-offset-green-600 dark:focus:ring-green-600',
        indigo: 'text-indigo-700 focus:ring-indigo-700 dark:ring-offset-indigo-700 dark:focus:ring-indigo-700',
        lime: 'text-lime-700 focus:ring-lime-700 dark:ring-offset-lime-700 dark:focus:ring-lime-700',
        pink: 'text-pink-600 focus:ring-pink-600 dark:ring-offset-pink-600 dark:focus:ring-pink-600',
        red: 'text-red-600 focus:ring-red-600 dark:ring-offset-red-600 dark:focus:ring-red-600',
        teal: 'text-teal-600 focus:ring-teal-600 dark:ring-offset-teal-600 dark:focus:ring-teal-600',
        yellow: 'text-yellow-400 focus:ring-yellow-400 dark:ring-offset-yellow-400 dark:focus:ring-yellow-400',
      },
    },
  },
  spinner: {
    base: 'inline animate-spin text-gray-200',
    color: {
      failure: 'fill-red-600',
      gray: 'fill-gray-600',
      info: 'fill-cyan-600',
      pink: 'fill-pink-600',
      purple: 'fill-purple-600',
      success: 'fill-green-500',
      warning: 'fill-yellow-400',
      blue: 'fill-blue-600',
    },
    light: {
      off: {
        base: 'dark:text-gray-600',
        color: {
          failure: '',
          gray: 'dark:fill-gray-300',
          info: '',
          pink: '',
          purple: '',
          success: '',
          warning: '',
          blue: '',
        },
      },
      on: {
        base: '',
        color: {
          failure: '',
          gray: '',
          info: '',
          pink: '',
          purple: '',
          success: '',
          warning: '',
          blue: '',
        },
      },
    },
    size: {
      xs: 'h-3 w-3',
      sm: 'h-4 w-4',
      md: 'h-6 w-6',
      lg: 'h-8 w-8',
      xl: 'h-10 w-10',
    },
  },
});
