import { NextResponse } from "next/server";
import { Database } from 'sqlite3';

export type Job = {
    title: string
    company: string
    min_years_of_experience: string
    salary_min: number
    salary_max: number
    url: string
    description: string
}

export async function POST(request: Request): Promise<NextResponse | Response> {
    return GET(request);
}

export async function GET(request: Request): Promise<NextResponse | Response> {
    const db = new Database('spider.db');

    const sql = `
        SELECT title, company.company, min_years_of_experience, salary_min, salary_max, url, description
        FROM job
                LEFT JOIN company on job.uen = company.uen
        WHERE
        (
            description LIKE ? OR title LIKE ?
        )
        AND salary_min > ?
        AND salary_max < ?
        AND min_years_of_experience > ?
        AND min_years_of_experience < ?
        GROUP BY company.company, description;
    `;

    const query = await getQuery(request);

    return select<Job>(db, sql, query)
        .then(job => {
            return NextResponse.json({
                result: job,
            })
        })
        .catch(error => {
            throw new Error(error);
        });
}

async function getQuery(request: Request):  Promise<(string | number)[]> {
    let { searchParams } = new URL(request.url);

    return request.json()
        .then(json => {
            const term = json.term
                ? "%" + json.term + "%"
                : "%";

            return [
                term,
                term,
                json.salaryMin || 0,
                json.salaryMax || 30000,
                json.experienceMin || 0,
                json.experienceMax || 10,
            ]
        });
}

async function select<T>(db: Database, sql: string, params: (string | number)[]): Promise<T[]> {
    console.log(params.length);
    return new Promise<T[]>((resolve, reject) => {
        if (params.length != 6) {
            reject("Invalid number of parameters");
        }

        db.all<T>(sql, params, (_, rows) => {
            resolve(rows);
        })
    })
}

function prepareStatement() {
    
}