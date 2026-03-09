import { onRequestOptions as __api_contact_ts_onRequestOptions } from "C:\\Users\\opggh\\Desktop\\alahram-developments\\functions\\api\\contact.ts"
import { onRequestPost as __api_contact_ts_onRequestPost } from "C:\\Users\\opggh\\Desktop\\alahram-developments\\functions\\api\\contact.ts"
import { onRequestOptions as __api_newsletter_ts_onRequestOptions } from "C:\\Users\\opggh\\Desktop\\alahram-developments\\functions\\api\\newsletter.ts"
import { onRequestPost as __api_newsletter_ts_onRequestPost } from "C:\\Users\\opggh\\Desktop\\alahram-developments\\functions\\api\\newsletter.ts"

export const routes = [
    {
      routePath: "/api/contact",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_contact_ts_onRequestOptions],
    },
  {
      routePath: "/api/contact",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_contact_ts_onRequestPost],
    },
  {
      routePath: "/api/newsletter",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_newsletter_ts_onRequestOptions],
    },
  {
      routePath: "/api/newsletter",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_newsletter_ts_onRequestPost],
    },
  ]