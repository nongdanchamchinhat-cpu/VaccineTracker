import { describe, expect, test } from "vitest";

import { buildScheduleFromTemplates } from "./db";
import { FamilyMember, VaccineTemplate } from "./types";

describe('buildScheduleFromTemplates', () => {
  test('should offset dates correctly from birth_date for infants', () => {
    const member: Partial<FamilyMember> = {
      id: "member1",
      name: "Kobe",
      birth_date: "2024-01-01",
      member_type: "infant",
    };

    const templates: Partial<VaccineTemplate>[] = [
      {
        id: 1,
        vaccine_name: "Vaccine 1",
        recommended_age_days: 30,
        sort_order: 1,
        milestone: "1 month",
        recommended_age_label: "1m",
        origin: "VN",
        disease: "D1",
        estimated_price: 100,
        template_source: "vn_default_v1",
      },
      {
        id: 2,
        vaccine_name: "Vaccine 2",
        recommended_age_days: 60,
        sort_order: 2,
        milestone: "2 months",
        recommended_age_label: "2m",
        origin: "VN",
        disease: "D2",
        estimated_price: 200,
        template_source: "vn_default_v1",
      },
    ];

    const result = buildScheduleFromTemplates(
      member as FamilyMember,
      templates as VaccineTemplate[]
    );

    expect(result).toHaveLength(2);
    expect(result[0].scheduled_date).toBe("2024-01-31");
    expect(result[1].scheduled_date).toBe("2024-03-01");
  });

  test("should use member creation date for adult types", () => {
    const member: Partial<FamilyMember> = {
      id: "member1",
      name: "Dad",
      birth_date: "1980-01-01",
      member_type: "adult",
      created_at: "2024-05-10T10:00:00Z",
    };

    const templates: Partial<VaccineTemplate>[] = [
      {
        id: 1001,
        vaccine_name: "Adult Vaccine",
        recommended_age_days: 30,
        sort_order: 1,
        milestone: "Planned",
        recommended_age_label: "30d after",
        origin: "VN",
        disease: "D",
        estimated_price: 100,
        template_source: "vn_default_v1",
      },
    ];

    const result = buildScheduleFromTemplates(
      member as FamilyMember,
      templates as VaccineTemplate[]
    );

    expect(result[0].scheduled_date).toBe("2024-06-09");
  });

  test("should include all required fields with member_id", () => {
    const member: Partial<FamilyMember> = {
      id: "member1",
      name: "Kobe",
      birth_date: "2024-05-10",
      member_type: "infant",
    };

    const templates: Partial<VaccineTemplate>[] = [
      {
        id: 99,
        vaccine_name: "Test Vaccine",
        recommended_age_days: 0,
        sort_order: 10,
        milestone: "Birth",
        recommended_age_label: "0d",
        origin: "Mỹ",
        disease: "Bệnh X",
        estimated_price: 1500000,
        template_source: "vn_default_v1",
      },
    ];

    const result = buildScheduleFromTemplates(
      member as FamilyMember,
      templates as VaccineTemplate[]
    );

    expect(result[0]).toMatchObject({
      member_id: "member1",
      template_entry_id: 99,
      vaccine_name: "Test Vaccine",
      scheduled_date: "2024-05-10",
    });
  });
});
