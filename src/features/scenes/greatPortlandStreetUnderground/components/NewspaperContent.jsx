import "./NewspaperContent.scss";

const NewspaperContent = ({ title, date, articles }) => {
  return (
    <div className="newspaper-content">
      <header className="newspaper-content__header">
        <div className="newspaper-content__title">{title}</div>
        <div className="newspaper-content__date">{date}</div>
        <div className="newspaper-content__rule" />
      </header>
      <div className="newspaper-content__columns">
        {articles.map((article, i) => (
          <article key={i} className="newspaper-content__article">
            <h2 className="newspaper-content__headline">{article.headline}</h2>
            <p className="newspaper-content__body">{article.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
};

export default NewspaperContent;
