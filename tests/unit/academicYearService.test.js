const { getAcademicStartYear, getAcademicYearStatus } = require('../../src/services/academicYearService');
const User = require('../../src/models/User');

describe('academic year calculation', () => {
  test('keeps academicStartYear optional and separate from yearOfStudy', () => {
    expect(User.schema.path('academicStartYear')).toBeDefined();
    expect(User.schema.path('academicStartYear').isRequired).not.toBe(true);
    expect(User.schema.path('yearOfStudy').instance).toBe('Number');
  });

  test('changes academic year at August 10 in India Standard Time', () => {
    expect(getAcademicStartYear(new Date('2026-08-09T18:29:59.999Z'))).toBe(2025);
    expect(getAcademicStartYear(new Date('2026-08-09T18:30:00.000Z'))).toBe(2026);
  });

  test('advances consistently across leap years and multiple years', () => {
    const member = { academicStartYear: 2022, yearOfStudy: 1 };
    expect(getAcademicYearStatus(member, new Date('2024-02-29T12:00:00Z'))).toMatchObject({ yearOfStudy: 2, isAlumni: false });
    expect(getAcademicYearStatus(member, new Date('2026-08-09T12:00:00+05:30'))).toMatchObject({ yearOfStudy: 4, isAlumni: false });
    expect(getAcademicYearStatus(member, new Date('2026-08-10T12:00:00+05:30'))).toMatchObject({ yearOfStudy: 5, isAlumni: true });
  });

  test('preserves unverified legacy year and flags it for review', () => {
    expect(getAcademicYearStatus({ yearOfStudy: 3 }, new Date('2026-08-10T12:00:00Z'))).toEqual({
      yearOfStudy: 3,
      isAlumni: false,
      academicYearReviewRequired: true,
    });
    expect(getAcademicYearStatus({ yearOfStudy: 5 }, new Date('2026-08-10T12:00:00Z'))).toMatchObject({
      yearOfStudy: 5,
      isAlumni: true,
      academicYearReviewRequired: true,
    });
  });
});