# Generated by Django 5.1.7 on 2025-03-21 15:41

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("attendance_app", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="student",
            name="joined_date",
            field=models.DateField(null=True),
        ),
        migrations.AddField(
            model_name="student",
            name="phone",
            field=models.IntegerField(null=True),
        ),
    ]
