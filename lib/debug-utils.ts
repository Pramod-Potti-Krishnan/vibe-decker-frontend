/**
 * Debug utilities for API integration
 */

export function logStructure(structure: any, label: string = 'Structure') {
  console.group(`[DEBUG] ${label}`)
  console.log('Type:', typeof structure)
  console.log('Is Array:', Array.isArray(structure))
  console.log('Keys:', structure ? Object.keys(structure) : 'null')
  
  if (structure?.slides) {
    console.log('Slides count:', structure.slides.length)
    console.log('First slide:', structure.slides[0])
    
    if (structure.slides.length > 0) {
      const firstSlide = structure.slides[0]
      console.log('First slide keys:', Object.keys(firstSlide))
      console.log('First slide ID type:', typeof firstSlide.id)
      console.log('First slide title:', firstSlide.title)
      console.log('First slide description:', firstSlide.description)
    }
  }
  
  console.log('Full structure:', JSON.stringify(structure, null, 2))
  console.groupEnd()
}

export function validateSlide(slide: any, index: number): boolean {
  console.log(`[DEBUG] Validating slide ${index}:`, slide)
  
  const checks = {
    hasId: slide.id !== undefined && slide.id !== null,
    hasTitle: slide.title !== undefined && slide.title !== null && slide.title !== '',
    hasDescription: slide.description !== undefined && slide.description !== null && slide.description !== ''
  }
  
  console.log(`Slide ${index} validation:`, checks)
  
  return checks.hasId && checks.hasTitle && checks.hasDescription
}

export function compareStructures(structure1: any, structure2: any) {
  console.group('[DEBUG] Structure Comparison')
  console.log('Structure 1 keys:', structure1 ? Object.keys(structure1) : 'null')
  console.log('Structure 2 keys:', structure2 ? Object.keys(structure2) : 'null')
  
  if (structure1?.slides && structure2?.slides) {
    console.log('Slides count comparison:', structure1.slides.length, 'vs', structure2.slides.length)
  }
  
  console.groupEnd()
}