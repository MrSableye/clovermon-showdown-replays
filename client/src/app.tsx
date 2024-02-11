import { useState, useEffect } from 'preact/hooks'
import { Replay, searchReplays } from './api';
import useInfiniteScroll from 'react-infinite-scroll-hook';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import SortIcon from '@mui/icons-material/Sort';

const searchDelay = 200;
const toID = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '');
const dateOptions: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
};

export const ReplayDisplay = ({ replay }: { replay: Replay }) => {
  const date = new Date(replay.uploadtime * 1000);
  return (
    <Grid item xs={6} md={4}>
      <ListItem>
        <ListItemButton href={`/replays/${replay.id}`} target='_blank' rel='noopener noreferrer'>
          <ListItemText
            primary={`${replay.p1} vs. ${replay.p2}`}
            secondary={`${replay.format} [${date.toLocaleDateString('en-us', dateOptions)}]`}
          />
        </ListItemButton>
      </ListItem>
    </Grid>
  );
};

export function App() {
  const [page, setPage] = useState(1);
  const [format, setFormat] = useState('');
  const [username1, setUsername1] = useState('');
  const [username2, setUsername2] = useState('');
  const [replays, setReplays] = useState<Replay[]>([]);
  const [searchTimeout, setSearchTimeout] = useState<number>(-1);
  const [order, setOrder] = useState<'DESC' | 'ASC'>('DESC');
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const loadMore = () => {
    if (isLoading) return;
    if (!hasMore) return;
    setPage((previous) => previous + 1);
  };

  const [sentryRef] = useInfiniteScroll({
    loading: isLoading,
    hasNextPage: hasMore,
    onLoadMore: loadMore, 
  });

  /* Reset page if format or usernames change */
  useEffect(() => {
    setPage(1);
    setIsLoading(false);
    setHasMore(true);
    setReplays([]);
    clearTimeout(searchTimeout);
  }, [order, format, username1, username2]);

  useEffect(() => {
    setHasMore(true);
    setIsLoading(true);
    clearTimeout(searchTimeout);
    setSearchTimeout(window.setTimeout(() => {
      setIsLoading(true);
      searchReplays({
        page,
        format: toID(format),
        username: toID(username1),
        username2: toID(username2),
        order,
      }).then((replays) => {
        setIsLoading(false);
        if (replays.length) {
          setReplays((previous) => [...previous, ...replays]);
        } else {
          setHasMore(false);
        }
      }).catch(() => setIsLoading(false));
    }, searchDelay));
  }, [page, format, username1, username2]);

  return (
    <Box sx={{ m: 1 }}>
      <Container maxWidth='lg'>
        <Paper elevation={3} sx={{ p: 1 }}>
          <Grid container direction='row' spacing={1} sx={{ p: 1 }}>
            <Grid item xs={5}>
              <TextField fullWidth label={'Format'} value={format} onChange={(event) => setFormat(event.currentTarget.value)} />
            </Grid>
            <Grid item xs={3}>
              <TextField fullWidth label={'Player 1'} value={username1} onChange={(event) => setUsername1(event.currentTarget.value)} />
            </Grid>
            <Grid item xs={3}>
              <TextField fullWidth label={'Player 2'} value={username2} onChange={(event) => setUsername2(event.currentTarget.value)} />
            </Grid>
            <Grid item xs={1}>
              <ToggleButtonGroup>
                <Tooltip title="Sort Descending">
                  <ToggleButton selected={order === 'DESC'} value='DESC' onClick={() => setOrder('DESC')}>
                    <SortIcon />
                  </ToggleButton>
                </Tooltip>
                <Tooltip title="Sort Ascending">
                  <ToggleButton selected={order === 'ASC'} value='ASC' onClick={() => setOrder('ASC')}>
                    <SortIcon sx={{ transform: 'scaleY(-1)' }}/>
                  </ToggleButton>
                </Tooltip>
              </ToggleButtonGroup>
            </Grid>
          </Grid>
          <List dense={true}>
            <Grid container>
              {replays.map((replay) => <ReplayDisplay replay={replay} />)}
            </Grid>
          </List>
          {(isLoading || hasMore) && <Grid container alignItems='center' justifyContent='center'><CircularProgress ref={sentryRef} /></Grid>}
        </Paper>
      </Container>
    </Box>
  );
}
