export function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

export const APP_NAME = "OmniDesk IT";
export const APP_TAGLINE = "Enterprise IT Service Management";
