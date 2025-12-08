export const linkQuery = `
  _key,
  ...,
  "href": select(
    // Anchor links (on-page)
    linkType == "anchor-link" && defined(anchorId) => "#" + anchorId,

    // Existing logic
    isExternal => href,
    defined(href) && !defined(internalLink) => href,
    @.internalLink->slug.current == "index" => "/",
    @.internalLink->_type == "post" => "/blog/" + @.internalLink->slug.current,
    "/" + @.internalLink->slug.current
  ),
  "anchorId": anchorId,
  "anchorOffsetPercent": anchorOffsetPercent
`;
