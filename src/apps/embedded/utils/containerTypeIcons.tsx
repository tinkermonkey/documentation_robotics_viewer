/**
 * Container type SVG icons for filter panels
 * Centralized icon definitions for C4 container types
 */

import { ContainerType } from '../types/c4Graph';

export const CONTAINER_TYPE_ICONS: Record<ContainerType, React.ReactElement> = {
  [ContainerType.WebApp]: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M0 3a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3zm2-1a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1H2z" />
      <path d="M2 4h12v1H2V4z" />
    </svg>
  ),
  [ContainerType.MobileApp]: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M4 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2H4zm0 1h8a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" />
      <path d="M7 12h2v1H7v-1z" />
    </svg>
  ),
  [ContainerType.DesktopApp]: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H2z" />
      <path d="M6 12h4v1H6v-1zm-2 2h8v1H4v-1z" />
    </svg>
  ),
  [ContainerType.Api]: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H4z" />
      <path d="M6 5h4v1H6V5zm0 2h4v1H6V7zm0 2h2v1H6V9z" />
    </svg>
  ),
  [ContainerType.Database]: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 2c3.314 0 6 1.119 6 2.5v7c0 1.381-2.686 2.5-6 2.5S2 12.881 2 11.5v-7C2 3.119 4.686 2 8 2zM8 3C5.243 3 3 3.895 3 4.5S5.243 6 8 6s5-.895 5-1.5S10.757 3 8 3z" />
      <path d="M3 7c0 .605 2.243 1.5 5 1.5s5-.895 5-1.5v4c0 .605-2.243 1.5-5 1.5s-5-.895-5-1.5V7z" />
    </svg>
  ),
  [ContainerType.MessageQueue]: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2 4h12v2H2V4zm0 3h12v2H2V7zm0 3h12v2H2v-2z" />
    </svg>
  ),
  [ContainerType.Cache]: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 1a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2 2 2 0 0 1-2-2V3a2 2 0 0 1 2-2zm0 1a1 1 0 0 0-1 1v10a1 1 0 0 0 2 0V3a1 1 0 0 0-1-1z" />
      <path d="M4 4h2v1H4V4zm0 2h2v1H4V6zm0 2h2v1H4V8zm6-4h2v1h-2V4zm0 2h2v1h-2V6zm0 2h2v1h-2V8z" />
    </svg>
  ),
  [ContainerType.FileStorage]: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2 2a1 1 0 0 1 1-1h4.586a1 1 0 0 1 .707.293L10.586 3H13a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V2z" />
    </svg>
  ),
  [ContainerType.Service]: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zM2 8a6 6 0 1 1 12 0A6 6 0 0 1 2 8z" />
      <path d="M8 5v6M5 8h6" />
    </svg>
  ),
  [ContainerType.Function]: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M10 3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V3zM2 3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3z" />
      <path d="M6 7h4v2H6V7z" />
    </svg>
  ),
  [ContainerType.Custom]: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 1l7 3v8l-7 3-7-3V4l7-3zm0 1.236L2 5v6l6 2.573L14 11V5L8 2.236z" />
    </svg>
  ),
};
