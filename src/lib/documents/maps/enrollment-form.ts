import type { ApplicationData, FieldEntry } from '../types'

export default function enrollmentFormMap(data: ApplicationData): FieldEntry[] {
  return [
    // Page 1 — Child info
    { type: 'text', page: 0, x: 0, y: 0, value: data.child.firstName },
    { type: 'text', page: 0, x: 0, y: 0, value: data.child.lastName },
    { type: 'text', page: 0, x: 0, y: 0, value: data.child.dateOfBirth },
    { type: 'text', page: 0, x: 0, y: 0, value: data.child.sex },
    { type: 'text', page: 0, x: 0, y: 0, value: `${data.parent1.address}, ${data.parent1.city}, ${data.parent1.state} ${data.parent1.zip}` },
    { type: 'text', page: 0, x: 0, y: 0, value: data.parent1.phone },
    { type: 'text', page: 0, x: 0, y: 0, value: data.parent1.email },
    // Father info
    { type: 'text', page: 0, x: 0, y: 0, value: `${data.parent1.firstName} ${data.parent1.lastName}` },
    { type: 'text', page: 0, x: 0, y: 0, value: data.parent1.employer ?? '' },
    { type: 'text', page: 0, x: 0, y: 0, value: data.parent1.employerAddress ?? '' },
    // Mother info (parent2)
    { type: 'text', page: 0, x: 0, y: 0, value: `${data.parent2.firstName ?? ''} ${data.parent2.lastName ?? ''}`.trim() },
    { type: 'text', page: 0, x: 0, y: 0, value: data.parent2.phone ?? '' },
    { type: 'text', page: 0, x: 0, y: 0, value: data.parent2.employer ?? '' },
    { type: 'text', page: 0, x: 0, y: 0, value: data.parent2.employerAddress ?? '' },
    // Living arrangement checkboxes
    { type: 'checkbox', page: 0, x: 0, y: 0, checked: data.livingArrangement === 'BOTH_PARENTS' },
    { type: 'checkbox', page: 0, x: 0, y: 0, checked: data.livingArrangement === 'MOTHER' },
    { type: 'checkbox', page: 0, x: 0, y: 0, checked: data.livingArrangement === 'FATHER' },
    { type: 'checkbox', page: 0, x: 0, y: 0, checked: data.livingArrangement === 'OTHER' },
    // Authorized pickup slot 1
    { type: 'text', page: 0, x: 0, y: 0, value: data.pickups[0]?.name ?? '' },
    { type: 'text', page: 0, x: 0, y: 0, value: data.pickups[0]?.address ?? '' },
    { type: 'text', page: 0, x: 0, y: 0, value: data.pickups[0]?.phone ?? '' },
    { type: 'text', page: 0, x: 0, y: 0, value: data.pickups[0]?.relationship ?? '' },
    // Authorized pickup slot 2
    { type: 'text', page: 0, x: 0, y: 0, value: data.pickups[1]?.name ?? '' },
    { type: 'text', page: 0, x: 0, y: 0, value: data.pickups[1]?.address ?? '' },
    { type: 'text', page: 0, x: 0, y: 0, value: data.pickups[1]?.phone ?? '' },
    { type: 'text', page: 0, x: 0, y: 0, value: data.pickups[1]?.relationship ?? '' },
    // Emergency contacts
    { type: 'text', page: 0, x: 0, y: 0, value: data.emergencyContacts[0]?.name ?? '' },
    { type: 'text', page: 0, x: 0, y: 0, value: data.emergencyContacts[0]?.phone ?? '' },
    { type: 'text', page: 0, x: 0, y: 0, value: data.emergencyContacts[1]?.name ?? '' },
    { type: 'text', page: 0, x: 0, y: 0, value: data.emergencyContacts[1]?.phone ?? '' },
    { type: 'text', page: 0, x: 0, y: 0, value: data.emergencyContacts[2]?.name ?? '' },
    { type: 'text', page: 0, x: 0, y: 0, value: data.emergencyContacts[2]?.phone ?? '' },
    // School / medical
    { type: 'text', page: 0, x: 0, y: 0, value: data.currentSchool ?? '' },
    { type: 'text', page: 0, x: 0, y: 0, value: data.doctor.name ?? '' },
    { type: 'text', page: 0, x: 0, y: 0, value: data.doctor.phone ?? '' },
    { type: 'text', page: 0, x: 0, y: 0, value: data.specialNeeds ?? '' },
    { type: 'text', page: 0, x: 0, y: 0, value: data.medications ?? '' },
    { type: 'text', page: 0, x: 0, y: 0, value: data.allergies ?? '' },
    // Days of week checkboxes
    { type: 'checkbox', page: 0, x: 0, y: 0, checked: data.schedule.daysOfWeek.includes('Monday') },
    { type: 'checkbox', page: 0, x: 0, y: 0, checked: data.schedule.daysOfWeek.includes('Tuesday') },
    { type: 'checkbox', page: 0, x: 0, y: 0, checked: data.schedule.daysOfWeek.includes('Wednesday') },
    { type: 'checkbox', page: 0, x: 0, y: 0, checked: data.schedule.daysOfWeek.includes('Thursday') },
    { type: 'checkbox', page: 0, x: 0, y: 0, checked: data.schedule.daysOfWeek.includes('Friday') },
    // Meal plan checkboxes
    { type: 'checkbox', page: 0, x: 0, y: 0, checked: data.schedule.mealPlan.includes('Breakfast') },
    { type: 'checkbox', page: 0, x: 0, y: 0, checked: data.schedule.mealPlan.includes('Lunch') },
    { type: 'checkbox', page: 0, x: 0, y: 0, checked: data.schedule.mealPlan.includes('PM Snack') },
    { type: 'checkbox', page: 0, x: 0, y: 0, checked: data.schedule.mealPlan.includes('Supper') },
  ]
}
