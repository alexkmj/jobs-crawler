import requests
import sqlite3
import json
import time

from tqdm import tqdm
from sqlite3 import Connection, Error
from bs4 import BeautifulSoup

class Job:
    def __init__(self, uuid: str, connection: Connection):
        self.uuid = uuid
        self.has_error = False
        self.connection = connection

    def get_href(self) -> str:
        return "https://api.mycareersfuture.gov.sg/v2/jobs/" + self.uuid

    def is_less_than_year(self, year: int) -> bool:
        if self.minimum_years_of_experience < year:
            return True

        return False

    def fetch(self):
        href = self.get_href()

        try:
            response = requests.get(href)
        except Error as e:
            self.has_error = True
            print(e)
            return

        content = json.loads(response.content)

        self.title = content["title"]
        self.description = content["description"]
        self.minimum_years_of_experience = content["minimumYearsExperience"]
        self.job_status = content["status"]["jobStatus"]
        self.uen = content["postedCompany"]["uen"]
        self.url = content["metadata"]["jobDetailsUrl"]
        self.salary_maximum = content["salary"]["maximum"]
        self.salary_minimum = content["salary"]["minimum"]

        self.company_name = content["postedCompany"]["name"]

        self.skills = [ x["skill"] for x in content["skills"] ]
        self.categories = [ x["category"] for x in content["categories"] ]
        self.employment_terms = [ x["employmentType"] for x in content["employmentTypes"] ]
        self.position_levels = [ x["position"] for x in content["positionLevels"] ]

    def get_job_tuple(self):
        return (
            self.uuid,
            self.title,
            self.description,
            self.minimum_years_of_experience,
            self.job_status,
            self.uen,
            self.url,
            self.salary_maximum,
            self.salary_minimum
        )

    def update_db(self):
        insert_skill = "INSERT OR REPLACE INTO skill (uuid, skill) VALUES (?, ?);"
        insert_categories = "INSERT OR REPLACE INTO category (uuid, category) VALUES (?, ?);"
        insert_employment_terms = "INSERT OR REPLACE INTO employment_term (uuid, term) VALUES (?, ?);"
        insert_position = "INSERT OR REPLACE INTO position (uuid, position) VALUES (?, ?);"
        insert_company = "INSERT OR REPLACE INTO company (uen, company) VALUES (?, ?);"

        insert_job = """
INSERT OR REPLACE INTO job (uuid, title, description, min_years_of_experience, job_status, uen, url, salary_max, salary_min)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
        """

        cursor = self.connection.cursor()
        cursor.execute(insert_job, self.get_job_tuple())

        cursor.execute(insert_company, (self.uen, self.company_name))

        for skill in self.skills:
            cursor.execute(insert_skill, (self.uuid, skill))

        for category in self.categories:
            cursor.execute(insert_categories, (self.uuid, category))

        for employment_term in self.employment_terms:
            cursor.execute(insert_employment_terms, (self.uuid, employment_term))

        for position_level in self.position_levels:
            cursor.execute(insert_position, (self.uuid, position_level))

        cursor.execute("COMMIT;")

    def __str__(self) -> str:
        if self.has_error:
            return "Unable to fetch job. { seld.uuid }"

        return f"""
================================================================================
   Title: { self.title }
   Terms: { ", ".join(self.employment_terms) }
Employer: { self.company_name }
     UEN: { self.uen }

Status: { self.job_status }
  Link: { self.url }

Min Years: { self.minimum_years_of_experience }
   Salary: { self.salary_minimum } to { self.salary_maximum }

      Categories: { ", ".join(self.categories) }
Employment Terms: { ", ".join(self.categories) }
          Skills: { ", ".join(self.skills) }
          Levels: { ", ".join(self.position_levels) }

Description:
{ self.description }
        """

def fetch_search_page(href: str, search_term: str, page: int):
    print("Current Page: " + str(page))

    params = { "limit": 100, "page": page }
    data   = { "search": search_term }

    response = requests.post(href, json=data, params=params)

    content = response.content
    result  = json.loads(content)

    job_count = result["total"]

    connection = create_connection()

    for index, job in enumerate(tqdm(result["results"])):
        if index % 10 == 0:
            time.sleep(3)

        id = job["metadata"]["jobDetailsUrl"]
        id = id.split("-")[-1]

        job = Job(id, connection)
        job.fetch()
        job.update_db()
    
    connection.close()

    if (page + 1) * 100 < job_count:
        fetch_search_page(href, search_term, page + 1)

def fetch_job():
    domain = "https://api.mycareersfuture.gov.sg"
    path = "/v2/search"
    search_term = "software engineer"

    fetch_search_page(domain + path, search_term, 0)

def create_tables(connection):
    sql_job = """
        CREATE TABLE IF NOT EXISTS job (
            uuid                    TEXT PRIMARY KEY,
            title                   TEXT,
            description             TEXT,
            min_years_of_experience INTEGER,
            job_status              TEXT,
            uen                     TEXT,
            url                     TEXT,
            salary_max              INTEGER,
            salary_min              INTEGER
        );
    """

    sql_skill = """
        CREATE TABLE IF NOT EXISTS skill (
            uuid    TEXT,
            skill   TEXT,
            PRIMARY KEY (uuid, skill)
        );
    """

    sql_category = """
        CREATE TABLE IF NOT EXISTS category (
            uuid        TEXT,
            category    TEXT,
            PRIMARY KEY (uuid, category)
        );
    """

    sql_employment_term = """
        CREATE TABLE IF NOT EXISTS employment_term (
            uuid    TEXT,
            term    TEXT,
            PRIMARY KEY (uuid, term)
        );
    """

    sql_position = """
        CREATE TABLE IF NOT EXISTS position (
            uuid        TEXT,
            position    TEXT,
            PRIMARY KEY (uuid, position)
        );
    """

    sql_company = """
        CREATE TABLE IF NOT EXISTS company (
            uen     TEXT,
            company TEXT,
            PRIMARY KEY (uen, company)
        );
    """

    if connection is not None:
        create_table(connection, sql_job)
        create_table(connection, sql_skill)
        create_table(connection, sql_category)
        create_table(connection, sql_employment_term)
        create_table(connection, sql_company)
        create_table(connection, sql_position)
    else:
        print("Unable to establish a connection with the database")

def create_connection(db_file=r"spider.db") -> Connection:
    connection = None
    try:
        connection = sqlite3.connect(db_file)
        return connection
    except Error as e:
        print(e)
        return None

def create_table(connection, sql):
    try:
        cursor = connection.cursor()
        cursor.execute(sql)
    except Error as e:
        print(e)

def read_main_pages():
    pass

def main():
    db = r"spider.db"

    connection = create_connection(db)

    create_tables(connection)
    fetch_job()

if __name__ == "__main__":
    main()
