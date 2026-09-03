from django.apps import AppConfig

class ReviewsConfig(AppConfig):
    default = True
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.reviews'

    def ready(self):
        import apps.reviews.signals
