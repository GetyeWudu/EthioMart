from django.db import models


class ProductStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft (Incomplete/Unpublished)"
    PENDING_REVIEW = "PENDING_REVIEW", "Pending Admin Review"
    ACTIVE = "ACTIVE", "Active & Publicly Listed"
    REJECTED = "REJECTED", "Rejected by Compliance / Admin"
    ARCHIVED = "ARCHIVED", "Archived / Discontinued"


class ProductType(models.TextChoices):
    SIMPLE = "SIMPLE", "Single SKU Product"
    CONFIGURABLE_VARIANT = "CONFIGURABLE_VARIANT", "Multi-Variant Configurable (Size, Color, etc.)"


class AttributeType(models.TextChoices):
    TEXT = "TEXT", "Free Text"
    NUMBER = "NUMBER", "Numeric Value"
    SELECT = "SELECT", "Single Select"
    MULTI_SELECT = "MULTI_SELECT", "Multi-Select"
    BOOLEAN = "BOOLEAN", "Yes / No"
