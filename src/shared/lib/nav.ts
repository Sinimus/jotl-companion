/** True when `pathname` is the nav item's own address or lies under one of its sections. */
export function isInSection(pathname: string, item: { path: string; sections: string[] }): boolean {
  if (pathname === item.path) return true
  return item.sections.some((section) => pathname === section || pathname.startsWith(`${section}/`))
}
