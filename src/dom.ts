const { AnyFrame } = __anyframe_core__

const styleTag = document.createElement('style')
styleTag.textContent = new AnyFrame({
  property: { bg: 'background' }
}).create(
  [...document.querySelectorAll('*')].flatMap(
    (el) => el.getAttribute('class')?.split(/\s+/).filter(Boolean) || []
  )
)
document.head.appendChild(styleTag)
