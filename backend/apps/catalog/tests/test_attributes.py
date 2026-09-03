from django.test import TestCase
from apps.catalog.models import Category, Attribute, AttributeValue, CategoryAttribute
from apps.catalog.enums import AttributeType
from apps.catalog.services.taxonomy_service import TaxonomyService


class AttributeMatrixTests(TestCase):
    def setUp(self):
        self.category = TaxonomyService.create_root_category(name="Mobile Phones")
        self.ram_attr = Attribute.objects.create(
            name="RAM Capacity",
            attribute_type=AttributeType.SELECT,
            unit="GB"
        )
        self.color_attr = Attribute.objects.create(
            name="Body Color",
            attribute_type=AttributeType.SELECT
        )

    def test_attribute_value_options(self):
        val_8gb = AttributeValue.objects.create(attribute=self.ram_attr, value="8GB")
        val_16gb = AttributeValue.objects.create(attribute=self.ram_attr, value="16GB")
        val_black = AttributeValue.objects.create(
            attribute=self.color_attr,
            value="Obsidian Black",
            color_code="#111111"
        )

        self.assertEqual(self.ram_attr.values.count(), 2)
        self.assertEqual(val_black.color_code, "#111111")

    def test_category_attribute_binding(self):
        # Color creates variants, RAM is a required descriptive spec
        binding_color = CategoryAttribute.objects.create(
            category=self.category,
            attribute=self.color_attr,
            is_variant_creator=True,
            is_required=True
        )
        binding_ram = CategoryAttribute.objects.create(
            category=self.category,
            attribute=self.ram_attr,
            is_variant_creator=False,
            is_required=True,
            is_filterable=True
        )

        self.assertEqual(self.category.category_attributes.count(), 2)
        self.assertTrue(binding_color.is_variant_creator)
        self.assertFalse(binding_ram.is_variant_creator)
        self.assertTrue(binding_ram.is_filterable)
