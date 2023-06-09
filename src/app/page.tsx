"use client";

import React, { ChangeEvent, useState } from 'react'

import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import axios from 'axios';
import { Job } from './api/jobs/route';

import Grid from '@mui/material/Unstable_Grid2';

export default function Home() {
  return (
    <main>
      <SearchCard></SearchCard>
    </main>
  )
}

function JobCard(job: Job) {
  return (
    <Container maxWidth="lg" sx={{ marginTop: 4 }} >
      <Card sx={{ minWidth: 275, backgroundColor: "#f8f7f9", borderRadius: "16px", padding: 4 }}>
        <CardContent>
          <Grid container>
            <Grid xs={9}>
              <h2>{job.title}</h2>
              <div dangerouslySetInnerHTML={{ __html: job.description }} />
            </Grid>
            <Grid xs={3}>
              <h4>{job.company}</h4>
              <h4>${job.salary_min} - ${job.salary_max}</h4>
              <h4>Minimum Experience: {job.min_years_of_experience} Years</h4>
              <Button size="large" variant="contained" sx={{ verticalAlign: "bottom" }} href={job.url} target="_blank" rel="noreferrer" >View</Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Container>
  )
}

function SearchCard() {
  const [terms, setTerms] = useState("");
  const [salaryMin, setSalaryMin] = useState(0);
  const [salaryMax, setSalaryMax] = useState(10000);
  const [experience, setExperience] = useState(3);
  const [jobs, setJobs] = useState([] as Job[]);

  const updateString = (fun: React.Dispatch<React.SetStateAction<string>>) => {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event && event.target && event.target.value) {
        fun(event.target.value);
      } else {
        fun("");
      }
    }
  }

  const updateNumber = (fun: React.Dispatch<React.SetStateAction<number>>) => {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event && event.target && event.target.value) {
        fun(event.target.value);
      } else {
        fun("");
      }
    }
  }

  const updateTerms = updateString(setTerms);
  const updateSalaryMin = updateNumber(setSalaryMin);
  const updateSalaryMax = updateNumber(setSalaryMax);
  const updateExperience = updateNumber(setExperience);

  const search = () => {
    axios.post('/api/jobs', {
      term: terms,
      salaryMin: salaryMin,
      salaryMax: salaryMax,
      experienceMax: experience,
    })
    .then(function (response) {
      if (!response || !Array.isArray(response.data.result)) {
        throw new Error("Unable to search");
      }

      setJobs(response.data.result as Job[])
    });
  }

  return (
    <>
      <Container maxWidth="lg" sx={{ marginTop: 8 }} >
        <Card sx={{ minWidth: 275, backgroundColor: "#f8f7f9", borderRadius: "16px", padding: 4 }}>
          <CardContent>
            <TextField id="terms"
              fullWidth
              value={terms}
              label="Enter search term"
              variant="outlined"
              onChange={updateTerms}
              sx={{ marginBottom: 2 }} />
            <TextField
              id="min-salary"
              value={salaryMin}
              label="Min Salary"
              onChange={updateSalaryMin}
            >
            </TextField>
            <TextField
              id="max-salary"
              value={salaryMax}
              label="Max Salary"
              sx={{ marginRight: 4 }}
              onChange={updateSalaryMax}
            >
            </TextField>
            <TextField
              id="max-experience"
              value={experience}
              label="Max Experience"
              sx={{  marginRight: 4 }}
              onChange={updateExperience}
            >
            </TextField>
            <Button size="large" variant="contained" sx={{ verticalAlign: "bottom" }} onClick={search} >Search</Button>
          </CardContent>
        </Card>
      </Container>
      {
        Array.isArray(jobs) && jobs.length > 0
          ? jobs.map(job => {
              return JobCard(job);
            })
          :
          <div></div>
      }
    </>
  );
}

