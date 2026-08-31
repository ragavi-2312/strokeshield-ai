# Real-World Dataset Directory

> [!NOTE]
> **Real-world dataset integration pending.**
> No external clinical dataset has been committed or downloaded.

### Expected Dataset Schema for Future Ingestion

When placing clinical dataset files (e.g. `stroke_data.csv`) in this directory, ensure the following columns are present or mapped:

| Column | Type | Description |
|---|---|---|
| `id` | Integer | Unique record ID |
| `gender` | String | 'Male', 'Female', 'Other' |
| `age` | Float / Int | Patient age in years |
| `hypertension` | Int (0/1) | Documented history of hypertension |
| `heart_disease` | Int (0/1) | History of cardiac illness / CAD / AFib |
| `ever_married` | String | Marital status |
| `work_type` | String | Occupation category |
| `residence_type` | String | 'Urban' or 'Rural' |
| `avg_glucose_level` | Float | Fasting or random blood glucose (mg/dL) |
| `bmi` | Float | Body Mass Index (kg/m²) |
| `smoking_status` | String | 'formerly smoked', 'never smoked', 'smokes', 'Unknown' |
| `systolic_bp` | Float | Systolic blood pressure (mmHg) |
| `diastolic_bp` | Float | Diastolic blood pressure (mmHg) |
| `stroke` | Int (0/1) | Target label: 1 if acute stroke occurred, 0 otherwise |
